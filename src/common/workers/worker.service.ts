import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import { QueueService, JobData } from '../queues/queue.service';
import { QUEUE_NAMES, QUEUE_TIMEOUTS } from '../queues/queue.config';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  
  // Los 3 workers (uno por cola)
  private criticalWorker: Worker;
  private standardWorker: Worker;
  private backgroundWorker: Worker;

  constructor(
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
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
      }
    );

    // Worker para cola STANDARD  
    this.standardWorker = new Worker(
      QUEUE_NAMES.STANDARD,
      async (job) => this.processJob(job, 'STANDARD'),
      {
        connection: this.queueService.getStandardQueue().opts.connection,
        concurrency: 1,
      }
    );

    // Worker para cola BACKGROUND
    this.backgroundWorker = new Worker(
      QUEUE_NAMES.BACKGROUND,
      async (job) => this.processJob(job, 'BACKGROUND'),
      {
        connection: this.queueService.getBackgroundQueue().opts.connection,
        concurrency: 1,
      }
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
        this.logger.log(`✅ [${name}] Job ${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        this.logger.error(`❌ [${name}] Job ${job?.id} failed: ${err.message}`);
      });

      worker.on('error', (err) => {
        this.logger.error(`💥 [${name}] Worker error: ${err.message}`);
      });
    });
  }

  // Método principal para procesar cualquier job
  private async processJob(job: Job, queueType: string): Promise<any> {
    const jobData = job.data as JobData;
    const timeout = this.getTimeoutForQueue(queueType);
    
    this.logger.log(`📋 [${queueType}] Processing job ${job.id}: ${jobData.method} ${jobData.url}`);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`❌ [${queueType}] Job ${job.id} failed: ${errorMessage}`);
      
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
      
      this.logger.debug(`🔧 Executing request: ${jobData.method} ${jobData.url}`);
      
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
    this.logger.log(`👤 Simulating user registration for: ${jobData.body?.email}`);
    
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
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
      case 'CRITICAL': return QUEUE_TIMEOUTS.CRITICAL;
      case 'STANDARD': return QUEUE_TIMEOUTS.STANDARD;
      case 'BACKGROUND': return QUEUE_TIMEOUTS.BACKGROUND;
      default: return QUEUE_TIMEOUTS.STANDARD;
    }
  }

  // Guardar resultado en Redis con TTL de 1 hora
  private async saveJobResult(jobId: string, result: any, error: string | null): Promise<void> {
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
      this.logger.error(`❌ Failed to save job result in Redis: ${error.message}`);
    }
  }
}