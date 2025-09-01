import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Request, Response } from 'express';
import { QueueService } from '../queues/queue.service';
import { QueueConfigService } from './queue-config.service';
import { JobStatusService } from '../websockets/job-status.service';

@Injectable()
export class QueueInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QueueInterceptor.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly queueConfig: QueueConfigService,
    private readonly jobStatusService: JobStatusService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url, body, headers } = request;

    // Si el sistema de colas está deshabilitado, procesar normalmente
    if (!this.queueConfig.isQueueEnabled()) {
      return next.handle();
    }

    // Exclusiones del Interceptor - estos endpoints NO van a cola
    if (this.shouldExcludeFromQueue(url)) {
      this.logger.debug(`⚪ Excluded from queue: ${method} ${url}`);
      return next.handle();
    }

    try {
      // Generar job ID simple (timestamp + random)
      const jobId = this.generateJobId();

      // Extraer información básica
      const jobData = {
        id: jobId,
        method,
        url,
        body: method !== 'GET' ? body : undefined,
        headers: {
          authorization: headers.authorization,
          'content-type': headers['content-type'],
          'user-agent': headers['user-agent'],
        },
        userId: this.extractUserId(headers),
        timestamp: Date.now(),
      };

      // Determinar cola por prefijo de URL
      const queueType = this.determineQueueByUrl(url);

      // Crear job en la cola correspondiente
      let job;
      switch (queueType) {
        case 'critical':
          job = await this.queueService.addCriticalJob(jobData);
          break;
        case 'standard':
          job = await this.queueService.addStandardJob(jobData);
          break;
        case 'background':
          job = await this.queueService.addBackgroundJob(jobData);
          break;
        default:
          job = await this.queueService.addStandardJob(jobData);
      }

      this.logger.log(
        `📥 Job ${jobId} queued in ${queueType} queue for ${method} ${url}`,
      );

      // Notificar WebSocket que el job fue encolado
      this.jobStatusService.markJobQueued(jobId, queueType);

      // Retornar respuesta inmediata con job ID
      const queueResponse = {
        jobId,
        status: 'queued',
        estimatedTime: this.getEstimatedTime(queueType),
        checkStatusUrl: `/queues/job/${jobId}/status`,
        queueType,
        timestamp: new Date().toISOString(),
      };

      // Establecer status 202 y devolver el body como Observable para que Nest
      // lo entregue correctamente. Evitamos enviar manualmente la respuesta
      // porque eso provoca que Nest intente consumir el Observable y lance
      // un EmptyError (causa del doble envío de headers).
      response.status(202);
      return of(queueResponse);
    } catch (error) {
      this.logger.error(
        `❌ Error intercepting request ${method} ${url}:`,
        error,
      );
      // Si hay error en el interceptor, ejecutar normalmente
      return next.handle();
    }
  }

  // Exclusiones del Interceptor
  private shouldExcludeFromQueue(url: string): boolean {
    const exclusions = [
      '/queues/', // Consulta de estado de colas
      '/health', // Health checks para load balancers
      '/metrics', // Métricas de Prometheus
      '/queue-dashboard', // Dashboard de monitoreo
      '/websocket', // Endpoints de WebSocket
      '/sse', // Server-Sent Events
      '/__', // Rutas internas de desarrollo
    ];

    return exclusions.some((exclusion) => url.startsWith(exclusion));
  }

  // Determinar cola por prefijo de URL - Routing Logic Simplificado
  private determineQueueByUrl(
    url: string,
  ): 'critical' | 'standard' | 'background' {
    // Critical Queue - Operaciones que NO pueden esperar
    if (
      url.startsWith('/atomic-enrollment/') ||
      url.startsWith('/auth/login') ||
      url.startsWith('/auth/logout')
    ) {
      return 'critical';
    }

    // Background Queue - Pueden esperar
    if (
      url.startsWith('/reports/') ||
      url.startsWith('/notifications/') ||
      url.startsWith('/database-performance/')
    ) {
      return 'background';
    }

    // Standard Queue - Fallback para rutas no definidas
    // Incluye: /grades/*, /courses/*, /students/*, /academic-validations/*
    return 'standard';
  }

  // Generar job ID simple (timestamp + random)
  private generateJobId(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
  }

  // Extraer User ID de headers de auth (JWT)
  private extractUserId(headers: any): string | undefined {
    try {
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return undefined;

      const token = authHeader.substring(7);
      // Simple extraction sin validar JWT completo
      // Simple extraction sin validar JWT completo. Usar Buffer para decodificar
      // base64 en Node (evita dependencia de atob en ambiente servidor).
      const parts = token.split('.');
      if (parts.length < 2) return undefined;
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      return payload.sub || payload.userId || payload.id;
    } catch {
      return undefined;
    }
  }

  // Obtener tiempo estimado por tipo de cola
  private getEstimatedTime(queueType: string): string {
    switch (queueType) {
      case 'critical':
        return '5-30 seconds';
      case 'standard':
        return '15-60 seconds';
      case 'background':
        return '30-120 seconds';
      default:
        return '15-60 seconds';
    }
  }
}
