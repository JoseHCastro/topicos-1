import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import { QueueService, JobData } from '../queues/queue.service';
import { QUEUE_NAMES, QUEUE_TIMEOUTS } from '../queues/queue.config';
import { RedisService } from '../redis/redis.service';
import { ResourceMonitorService } from '../monitoring/resource-monitor.service';
import { ConnectionPoolService } from '../monitoring/connection-pool.service';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);

  // Los 3 workers (uno por cola)
  private criticalWorker: Worker;
  private standardWorker: Worker;
  private backgroundWorker: Worker;

  // Estadísticas de procesamiento
  private jobsProcessed = 0;
  private heavyJobsProcessed = 0;
  private lastGCTime = Date.now();

  constructor(
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
    private readonly moduleRef: ModuleRef,
    private readonly resourceMonitor: ResourceMonitorService,
    private readonly connectionPool: ConnectionPoolService,
  ) {}

  async onModuleInit() {
    // Configurar listeners de resource monitoring
    this.setupResourceMonitoring();

    // Inicializar los 3 workers
    await this.initializeWorkers();
    this.logger.log('🚀 All workers initialized and started processing');
  }

  async onModuleDestroy() {
    // Cerrar todos los workers correctamente
    await Promise.all([
      this.criticalWorker?.close(),
      this.standardWorker?.close(),
      this.backgroundWorker?.close(),
    ]);
    this.logger.log('🔴 All workers stopped');
  }

  private async initializeWorkers() {
    // Worker para cola CRITICAL
    this.criticalWorker = new Worker(
      QUEUE_NAMES.CRITICAL,
      async (job) => this.processJob(job, 'CRITICAL'),
      {
        connection: this.queueService.getCriticalQueue().opts.connection,
        concurrency: 1, // Procesar un job a la vez
      },
    );

    // Worker para cola STANDARD
    this.standardWorker = new Worker(
      QUEUE_NAMES.STANDARD,
      async (job) => this.processJob(job, 'STANDARD'),
      {
        connection: this.queueService.getStandardQueue().opts.connection,
        concurrency: 1,
      },
    );

    // Worker para cola BACKGROUND
    this.backgroundWorker = new Worker(
      QUEUE_NAMES.BACKGROUND,
      async (job) => this.processJob(job, 'BACKGROUND'),
      {
        connection: this.queueService.getBackgroundQueue().opts.connection,
        concurrency: 1,
      },
    );

    // Configurar event listeners para logging
    this.setupWorkerEventListeners();
  }

  private setupWorkerEventListeners() {
    const workers = [
      { worker: this.criticalWorker, name: 'CRITICAL' },
      { worker: this.standardWorker, name: 'STANDARD' },
      { worker: this.backgroundWorker, name: 'BACKGROUND' },
    ];

    workers.forEach(({ worker, name }) => {
      worker.on('active', (job) => {
        this.logger.log(`🔄 [${name}] Job ${job.id} started processing`);
      });

      worker.on('completed', (job, result) => {
        this.jobsProcessed++;
        this.logger.log(`✅ [${name}] Job ${job.id} completed successfully`);
        this.checkResourcesAfterJob(job, name);
      });

      worker.on('failed', (job, err) => {
        this.logger.error(`❌ [${name}] Job ${job?.id} failed: ${err.message}`);
        this.checkResourcesAfterJob(job, name);
      });

      worker.on('error', (err) => {
        this.logger.error(`💥 [${name}] Worker error: ${err.message}`);
      });
    });
  }

  private setupResourceMonitoring() {
    // Listener para alertas de memoria crítica
    this.resourceMonitor.on('memory-critical', (data) => {
      this.logger.error(
        `🚨 [WORKER] Memory critical: ${data.heapUsedMB}MB / ${data.limit}MB`,
      );
    });

    // Listener para warnings de memoria
    this.resourceMonitor.on('memory-warning', (data) => {
      this.logger.warn(
        `⚠️ [WORKER] Memory warning: ${data.heapUsedMB}MB / ${data.limit}MB`,
      );
      // Forzar GC si no se ha hecho recientemente
      this.maybeForceGarbageCollection();
    });

    // Listener para restart requerido
    this.resourceMonitor.on('memory-restart-required', (data) => {
      this.logger.error(
        `💥 [WORKER] Restart required due to sustained memory pressure`,
      );
      // En una implementación completa, aquí se podría notificar al supervisor
      // para restart del worker o todo el proceso
    });

    // Listener para memoria normalizada
    this.resourceMonitor.on('memory-normal', (data) => {
      this.logger.log(
        `✅ [WORKER] Memory usage normalized: ${data.heapUsedMB}MB`,
      );
    });
  }

  // Método principal para procesar cualquier job
  private async processJob(job: Job, queueType: string): Promise<any> {
    const jobData = job.data as JobData;
    const timeout = this.getTimeoutForQueue(queueType);

    this.logger.log(
      `📋 [${queueType}] Processing job ${job.id}: ${jobData.method} ${jobData.url}`,
    );

    try {
      // Ejecutar con timeout
      const result = await Promise.race([
        this.executeHttpRequest(jobData),
        this.createTimeoutPromise(timeout * 1000), // convertir a milisegundos
      ]);

      // Guardar resultado en Redis con TTL de 1 hora
      await this.saveJobResult(job.id!, result, null);

      this.logger.log(`✅ [${queueType}] Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      // Error handling básico
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `❌ [${queueType}] Job ${job.id} failed: ${errorMessage}`,
      );

      // Guardar error en Redis
      await this.saveJobResult(job.id!, null, errorMessage);

      // Re-lanzar error para que BullMQ maneje los retries
      throw error;
    }
  }

  // Reconstruir contexto HTTP y ejecutar handler original
  private async executeHttpRequest(jobData: JobData): Promise<any> {
    try {
      // Por ahora, simular la ejecución del endpoint original
      // TODO: En una implementación completa, aquí reconstruiríamos el contexto HTTP
      // y ejecutaríamos el controlador/servicio original

      this.logger.debug(
        `🔧 Executing request: ${jobData.method} ${jobData.url}`,
      );

      // Simulación básica para testing
      if (jobData.url.includes('/auth/register')) {
        return this.simulateUserRegistration(jobData);
      }

      if (jobData.url.includes('/auth/login')) {
        return this.simulateUserLogin(jobData);
      }

      if (jobData.url.includes('/courses')) {
        return this.simulateCourseQuery(jobData);
      }

      // Respuesta genérica para otros endpoints
      return {
        success: true,
        message: `Request processed successfully: ${jobData.method} ${jobData.url}`,
        timestamp: new Date().toISOString(),
        data: jobData.body || null,
      };
    } catch (error) {
      this.logger.error(`💥 Error executing HTTP request: ${error.message}`);
      throw error;
    }
  }

  // Simulaciones para diferentes tipos de endpoints
  private async simulateUserRegistration(jobData: JobData): Promise<any> {
    this.logger.log(
      `👤 Simulating user registration for: ${jobData.body?.email}`,
    );

    // Simular tiempo de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: `user_${Date.now()}`,
        email: jobData.body?.email,
        firstName: jobData.body?.firstName,
        lastName: jobData.body?.lastName,
        role: jobData.body?.role,
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async simulateUserLogin(jobData: JobData): Promise<any> {
    this.logger.log(`🔐 Simulating user login for: ${jobData.body?.email}`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'Login successful',
      token: `jwt_token_${Date.now()}`,
      user: {
        email: jobData.body?.email,
        loginAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async simulateCourseQuery(jobData: JobData): Promise<any> {
    this.logger.log(`📚 Simulating course query`);

    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      success: true,
      message: 'Courses retrieved successfully',
      courses: [
        { id: 1, name: 'Matemáticas I', code: 'MAT101' },
        { id: 2, name: 'Programación I', code: 'PRG101' },
        { id: 3, name: 'Base de Datos', code: 'BDD201' },
      ],
      total: 3,
      timestamp: new Date().toISOString(),
    };
  }

  // Crear promise que falla después del timeout
  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timeout after ${ms}ms`));
      }, ms);
    });
  }

  // Obtener timeout según el tipo de cola
  private getTimeoutForQueue(queueType: string): number {
    switch (queueType) {
      case 'CRITICAL':
        return QUEUE_TIMEOUTS.CRITICAL;
      case 'STANDARD':
        return QUEUE_TIMEOUTS.STANDARD;
      case 'BACKGROUND':
        return QUEUE_TIMEOUTS.BACKGROUND;
      default:
        return QUEUE_TIMEOUTS.STANDARD;
    }
  }

  // Guardar resultado en Redis con TTL de 1 hora
  private async saveJobResult(
    jobId: string,
    result: any,
    error: string | null,
  ): Promise<void> {
    const resultKey = `job:result:${jobId}`;
    const resultData = {
      jobId,
      result,
      error,
      completedAt: new Date().toISOString(),
    };

    try {
      // TTL de 1 hora (3600 segundos)
      await this.redisService.set(resultKey, JSON.stringify(resultData), 3600);
      this.logger.debug(`💾 Job result saved in Redis: ${resultKey}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to save job result in Redis: ${error.message}`,
      );
    }
  }

  // ========== RESOURCE MANAGEMENT METHODS ==========

  private checkResourcesAfterJob(job: Job, queueType: string) {
    // Verificar si es un job "pesado" que requiere cleanup
    const isHeavyJob = this.isHeavyJob(job);

    if (isHeavyJob) {
      this.heavyJobsProcessed++;
      this.logger.debug(
        `🏋️ Heavy job ${job.id} completed (total: ${this.heavyJobsProcessed})`,
      );

      // Forzar GC después de jobs pesados según especificación
      this.maybeForceGarbageCollection();
    }

    // Log de memoria cada 10 jobs en desarrollo
    if (
      process.env.NODE_ENV === 'development' &&
      this.jobsProcessed % 10 === 0
    ) {
      const memoryUsage = this.resourceMonitor.getCurrentMemoryUsage();
      const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(1);
      this.logger.debug(
        `📊 [${queueType}] Jobs processed: ${this.jobsProcessed}, Memory: ${heapUsedMB}MB`,
      );
    }
  }

  private isHeavyJob(job: Job): boolean {
    const jobData = job.data as JobData;

    // Determinar si un job es "pesado" basado en varios criterios
    const heavyPatterns = [
      '/reports/', // Generación de reportes
      '/database-performance/', // Tests de performance
      '/load-test/', // Load testing
      '/atomic-enrollment/', // Inscripciones atómicas (uso intensivo de DB)
    ];

    const isHeavyUrl = heavyPatterns.some((pattern) =>
      jobData.url?.includes(pattern),
    );

    // También considerar jobs con mucho payload
    const hasLargePayload =
      jobData.body && JSON.stringify(jobData.body).length > 10000; // 10KB+

    return isHeavyUrl || hasLargePayload;
  }

  private maybeForceGarbageCollection(): boolean {
    const now = Date.now();
    const timeSinceLastGC = now - this.lastGCTime;

    // Solo hacer GC si han pasado al menos 30 segundos desde el último
    if (timeSinceLastGC > 30000) {
      this.lastGCTime = now;
      const gcResult = this.resourceMonitor.forceGarbageCollection();

      if (gcResult) {
        this.logger.debug(
          `♻️ Forced garbage collection after ${this.heavyJobsProcessed} heavy jobs`,
        );
      }

      return gcResult;
    }

    return false;
  }

  // ========== PUBLIC API FOR MONITORING ==========

  getWorkerStats() {
    const memoryHealth = this.resourceMonitor.getHealthStatus();
    const poolHealth = this.connectionPool.getHealthStatus();
    const currentMemory = this.resourceMonitor.getCurrentMemoryUsage();

    return {
      jobs: {
        totalProcessed: this.jobsProcessed,
        heavyJobsProcessed: this.heavyJobsProcessed,
      },
      memory: {
        status: memoryHealth.status,
        heapUsedMB: (currentMemory.heapUsed / 1024 / 1024).toFixed(1),
        heapTotalMB: (currentMemory.heapTotal / 1024 / 1024).toFixed(1),
        usagePercent: this.resourceMonitor
          .getMemoryUsagePercentage()
          .toFixed(1),
        limits: this.resourceMonitor.getLimits(),
      },
      connectionPool: {
        status: poolHealth.status,
        stats: this.connectionPool.getCurrentStats(),
        config: this.connectionPool.getConfig(),
      },
      uptime: process.uptime(),
      lastGCTime: new Date(this.lastGCTime).toISOString(),
    };
  }

  async performResourceCleanup(): Promise<{ success: boolean; details: any }> {
    try {
      const beforeMemory = this.resourceMonitor.getCurrentMemoryUsage();

      // 1. Forzar garbage collection
      const gcResult = this.resourceMonitor.forceGarbageCollection();

      // 2. Limpiar conexiones idle
      await this.connectionPool.cleanupIdleConnections();

      // 3. Verificar test de conexión
      const connectionTest = await this.connectionPool.testConnection();

      const afterMemory = this.resourceMonitor.getCurrentMemoryUsage();
      const memoryFreedMB =
        (beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024;

      return {
        success: true,
        details: {
          garbageCollection: gcResult,
          memoryFreedMB: memoryFreedMB.toFixed(1),
          connectionTest: connectionTest,
          beforeMemoryMB: (beforeMemory.heapUsed / 1024 / 1024).toFixed(1),
          afterMemoryMB: (afterMemory.heapUsed / 1024 / 1024).toFixed(1),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error during resource cleanup: ${error.message}`);
      return {
        success: false,
        details: { error: error.message },
      };
    }
  }
}
