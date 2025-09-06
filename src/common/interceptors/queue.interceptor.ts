import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Request, Response } from 'express';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { QueueConfigService } from './queue-config.service';
import { JobStatusService } from '../websockets/job-status.service';
import { JobData, QueueResponse } from './interfaces/job-data.interface';

@Injectable()
export class QueueInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QueueInterceptor.name);

  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly queueConfig: QueueConfigService,
    private readonly jobStatusService: JobStatusService,
  ) { }

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

    // ⚠️ CRÍTICO: Excluir peticiones internas del worker para evitar loops infinitos
    if (headers['x-internal-request'] === 'true') {
      this.logger.debug(`🔄 Internal worker request bypassed: ${method} ${url}`);
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

      // Extraer y preparar datos de la petición
      const jobData: JobData = {
        id: jobId,
        method,
        url,
        data: this.extractRequestData(method, body, request.query),
        headers: {
          authorization: headers.authorization,
          'content-type': headers['content-type'],
          'user-agent': headers['user-agent'],
        },
        userId: this.extractUserId(headers),
        timestamp: Date.now(),
        queryParams: Object.keys(request.query).length > 0 ? request.query : undefined,
        clientIp: this.extractClientIp(request),
      };

      // Determinar cola dinámicamente por URL
      const queueName = this.queueService.determineQueueForUrl(url);
      const queueDef = this.queueService.getQueueDefinition(queueName);

      // Verificar que la cola existe y está habilitada
      if (!this.queueService.isQueueAvailable(queueName)) {
        this.logger.warn(`Queue '${queueName}' not available, falling back to processing`);
        return next.handle();
      }

      // Crear job en la cola determinada dinámicamente
      await this.queueService.addJobToQueue(queueName, jobData, {
        priority: queueDef?.priority,
        timeout: queueDef ? queueDef.timeout * 1000 : 60000, // Convert to ms
      });

      this.logger.log(
        `Job ${jobId} queued in '${queueName}' queue for ${method} ${url}`,
      );

      // Notificar WebSocket que el job fue encolado
      this.jobStatusService.markJobQueued(jobId, queueName);

      // Retornar respuesta inmediata con job ID
      const queueResponse: QueueResponse = {
        jobId,
        status: 'queued',
        estimatedTime: queueDef?.estimatedTime || 'Unknown',
        checkStatusUrl: `/queues/job/${jobId}/status`,
        queueType: queueName as any, // Keep compatibility with existing interface
        timestamp: new Date().toISOString(),
        metadata: {
          timeout: queueDef?.timeout || 60,
          priority: queueDef?.priority || 1,
          retryCount: 0,
        },
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

  // Exclusiones del Interceptor - Ahora configurable
  private shouldExcludeFromQueue(url: string): boolean {
    return this.queueConfig.shouldExcludeFromQueue(url);
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
    const queueDef = this.queueService.getQueueDefinition(queueType);
    return queueDef?.estimatedTime || '15-60 seconds';
  }

  /**
   * Extrae los datos relevantes de la petición según el método HTTP
   * @param method - Método HTTP
   * @param body - Body de la petición
   * @param queryParams - Query parameters
   * @returns Los datos a almacenar en el job
   */
  private extractRequestData(method: string, body: any, queryParams: any): any {
    switch (method.toUpperCase()) {
      case 'GET':
      case 'DELETE':
        // Para GET y DELETE, los datos importantes están en query params
        return Object.keys(queryParams).length > 0 ? queryParams : undefined;

      case 'POST':
      case 'PUT':
      case 'PATCH':
        // Para métodos con body, priorizar body pero incluir query si existe
        return {
          ...(body || {}),
          ...(Object.keys(queryParams).length > 0 && { queryParams }),
        };

      default:
        // Para métodos no estándar, incluir todo
        return {
          body: body || undefined,
          queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
    }
  }

  /**
   * Extrae la IP del cliente considerando proxies y load balancers
   * @param request - Request object
   * @returns IP del cliente
   */
  private extractClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Obtiene el timeout configurado para cada tipo de cola
   * @param queueType - Tipo de cola
   * @returns Timeout en segundos
   */
  private getTimeoutForQueue(queueType: string): number {
    const queueDef = this.queueService.getQueueDefinition(queueType);
    return queueDef?.timeout || 60;
  }

  /**
   * Obtiene la prioridad numérica para cada tipo de cola
   * @param queueType - Tipo de cola
   * @returns Prioridad (mayor número = mayor prioridad)
   */
  private getPriorityForQueue(queueType: string): number {
    const queueDef = this.queueService.getQueueDefinition(queueType);
    return queueDef?.priority || 1;
  }
}
