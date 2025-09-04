import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { JobData } from '../interceptors/interfaces/job-data.interface';
import { QueueDefinition } from '../queues/queue-config.interface';
import { RedisService } from '../redis/redis.service';
import { ResourceMonitorService } from '../monitoring/resource-monitor.service';
import { ConnectionPoolService } from '../monitoring/connection-pool.service';
import { ICacheService } from '../cache/interfaces/cache.interface';
import { CACHE_SERVICE_TOKEN } from '../cache/interfaces/cache.tokens';
import { CacheKeyBuilder } from '../cache/strategies/http-cache-key.strategy';
import { JobStatusService } from '../websockets/job-status.service';

@Injectable()
export class DynamicWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamicWorkerService.name);

  // Dynamic worker storage - Array per queue for multiple workers
  private workers: Map<string, Worker[]> = new Map();

  // Statistics
  private jobsProcessed = 0;
  private heavyJobsProcessed = 0;
  private lastGCTime = Date.now();

  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly redisService: RedisService,
    private readonly resourceMonitor: ResourceMonitorService,
    private readonly connectionPool: ConnectionPoolService,
    @Inject(CACHE_SERVICE_TOKEN)
    private readonly cacheService: ICacheService,
    private readonly cacheKeyBuilder: CacheKeyBuilder,
    @Inject(forwardRef(() => JobStatusService))
    private readonly jobStatusService: JobStatusService,
  ) {}

  async onModuleInit() {
    this.setupResourceMonitoring();
    await this.initializeWorkers();
    this.logger.log(`🚀 ${this.workers.size} dynamic workers initialized and started processing`);
  }

  async onModuleDestroy() {
    const allWorkers = Array.from(this.workers.values()).flat();
    const closePromises = allWorkers.map(worker => worker.close());
    await Promise.all(closePromises);
    this.logger.log(`🔴 All ${allWorkers.length} workers stopped`);
  }

  /**
   * Initialize workers for all available queues
   */
  private async initializeWorkers() {
    const availableQueues = this.queueService.getAvailableQueues();
    
    for (const queueName of availableQueues) {
      await this.createWorkerForQueue(queueName);
    }
  }

  /**
   * Create multiple workers for a specific queue based on configuration
   */
  private async createWorkerForQueue(queueName: string) {
    const queueDef = this.queueService.getQueueDefinition(queueName);
    const queue = this.queueService.getQueue(queueName);
    
    if (!queueDef || !queue) {
      this.logger.error(`Cannot create workers for queue '${queueName}' - queue definition or instance not found`);
      return;
    }

    // Get number of workers from configuration (default to 1 if not specified)
    const workerCount = queueDef.workers || 1;
    const queueWorkers: Worker[] = [];

    try {
      // Create multiple workers for this queue
      for (let i = 0; i < workerCount; i++) {
        const workerId = i + 1;
        const worker = new Worker(
          queueName,
          async (job) => this.processJob(job, queueName, queueDef, workerId),
          {
            connection: queue.opts.connection,
            concurrency: queueDef.concurrency,
          },
        );

        queueWorkers.push(worker);
        this.setupWorkerEventListeners(worker, queueName, workerId);
        
        this.logger.log(`✅ Worker #${workerId} created for queue '${queueName}' (concurrency: ${queueDef.concurrency})`);
      }

      // Store all workers for this queue
      this.workers.set(queueName, queueWorkers);
      
      this.logger.log(`🎉 ${workerCount} workers created for queue '${queueName}' (total concurrency: ${workerCount * queueDef.concurrency})`);
    } catch (error) {
      this.logger.error(`❌ Failed to create workers for queue '${queueName}':`, error);
    }
  }

  /**
   * Setup event listeners for a worker with worker ID
   */
  private setupWorkerEventListeners(worker: Worker, queueName: string, workerId?: number) {
    const workerInfo = workerId ? `#${workerId}` : '';
    const fullWorkerName = `${queueName} ${workerInfo}`.trim();

    worker.on('active', (job) => {
      this.logger.log(`🔄 [${fullWorkerName}] Job ${job.id} started processing`);
      if (job.id) {
        this.jobStatusService.markJobProcessing(job.id, queueName);
      }
    });

    worker.on('completed', (job, result) => {
      this.jobsProcessed++;
      this.logger.log(`✅ [${fullWorkerName}] Job ${job.id} completed successfully`);
      if (job.id) {
        this.jobStatusService.markJobCompleted(job.id, result);
      }
      if (job) {
        this.checkResourcesAfterJob(job, fullWorkerName);
      }
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`❌ [${fullWorkerName}] Job ${job?.id} failed: ${err.message}`);
      if (job?.id) {
        this.jobStatusService.markJobFailed(job.id, err.message);
      }
      if (job) {
        this.checkResourcesAfterJob(job, fullWorkerName);
      }
    });

    worker.on('progress', (job, progress) => {
      this.logger.debug(`📊 [${fullWorkerName}] Job ${job.id} progress: ${progress}%`);
      if (typeof progress === 'number' && job.id) {
        this.jobStatusService.updateJobProgress(job.id, progress);
      }
    });

    worker.on('error', (err) => {
      this.logger.error(`💥 [${fullWorkerName}] Worker error: ${err.message}`);
    });
  }

  /**
   * Process a job from any queue with worker identification
   */
  private async processJob(job: Job, queueName: string, queueDef: QueueDefinition, workerId?: number): Promise<any> {
    const jobData = job.data as JobData;
    const timeout = queueDef.timeout;
    const workerInfo = workerId ? ` [Worker #${workerId}]` : '';

    this.logger.log(
      `📋 [${queueName}]${workerInfo} Processing job ${job.id}: ${jobData.method} ${jobData.url}`,
    );

    try {
      // Check cache first
      let result = await this.tryGetFromCache(jobData);
      
      if (result) {
        this.logger.log(`💨 [${queueName}]${workerInfo} Job ${job.id} served from CACHE`);
        await this.saveJobResult(job.id!, result, null);
        return result;
      }

      // Cache miss - execute request
      this.logger.debug(`🔄 [${queueName}]${workerInfo} Cache miss - executing job ${job.id}`);
      
      // Execute with timeout
      result = await Promise.race([
        this.executeHttpRequest(jobData),
        this.createTimeoutPromise(timeout * 1000),
      ]);

      // Store in cache
      this.tryStoreInCache(jobData, result).catch(error => {
        this.logger.warn(`Cache store failed for job ${job.id}:`, error.message);
      });

      // Save result in Redis
      await this.saveJobResult(job.id!, result, null);

      this.logger.log(`✅ [${queueName}]${workerInfo} Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`❌ [${queueName}]${workerInfo} Job ${job.id} failed: ${errorMessage}`);
      
      // Save error in Redis
      await this.saveJobResult(job.id!, null, errorMessage);
      
      // Re-throw for BullMQ retry handling
      throw error;
    }
  }

  /**
   * Execute the original HTTP request logic
   */
  private async executeHttpRequest(jobData: JobData): Promise<any> {
    try {
      this.logger.debug(`🔧 Executing request: ${jobData.method} ${jobData.url}`);

      // Simulation logic (replace with actual endpoint execution)
      if (jobData.url.includes('/auth/register')) {
        return this.simulateUserRegistration(jobData);
      }

      if (jobData.url.includes('/auth/login')) {
        return this.simulateUserLogin(jobData);
      }

      if (jobData.url.includes('/courses')) {
        return this.simulateCourseQuery(jobData);
      }

      // Generic response
      return {
        success: true,
        message: `Request processed successfully: ${jobData.method} ${jobData.url}`,
        timestamp: new Date().toISOString(),
        data: jobData.data || null,
      };
    } catch (error) {
      this.logger.error(`💥 Error executing HTTP request: ${error.message}`);
      throw error;
    }
  }

  // Simulation methods (same as before but adapted for new structure)
  private async simulateUserRegistration(jobData: JobData): Promise<any> {
    this.logger.log(`👤 Simulating user registration for: ${jobData.data?.email}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: `user_${Date.now()}`,
        email: jobData.data?.email,
        firstName: jobData.data?.firstName,
        lastName: jobData.data?.lastName,
        role: jobData.data?.role,
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async simulateUserLogin(jobData: JobData): Promise<any> {
    this.logger.log(`🔐 Simulating user login for: ${jobData.data?.email}`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'Login successful',
      token: `jwt_token_${Date.now()}`,
      user: {
        email: jobData.data?.email,
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

  // Utility methods (same as before)
  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timeout after ${ms}ms`));
      }, ms);
    });
  }

  private async saveJobResult(jobId: string, result: any, error: string | null): Promise<void> {
    const resultKey = `job:result:${jobId}`;
    const resultData = {
      jobId,
      result,
      error,
      completedAt: new Date().toISOString(),
    };

    try {
      await this.redisService.set(resultKey, JSON.stringify(resultData), 3600);
      this.logger.debug(`💾 Job result saved in Redis: ${resultKey}`);
    } catch (error) {
      this.logger.error(`❌ Failed to save job result in Redis: ${error.message}`);
    }
  }

  // Resource management methods (same as before)
  private setupResourceMonitoring() {
    this.resourceMonitor.on('memory-critical', (data) => {
      this.logger.error(`🚨 [WORKER] Memory critical: ${data.heapUsedMB}MB / ${data.limit}MB`);
    });

    this.resourceMonitor.on('memory-warning', (data) => {
      this.logger.warn(`⚠️ [WORKER] Memory warning: ${data.heapUsedMB}MB / ${data.limit}MB`);
      this.maybeForceGarbageCollection();
    });
  }

  private checkResourcesAfterJob(job: Job, queueName: string) {
    const isHeavyJob = this.isHeavyJob(job);

    if (isHeavyJob) {
      this.heavyJobsProcessed++;
      this.logger.debug(`🏋️ Heavy job ${job.id} completed (total: ${this.heavyJobsProcessed})`);
      this.maybeForceGarbageCollection();
    }

    if (process.env.NODE_ENV === 'development' && this.jobsProcessed % 10 === 0) {
      const memoryUsage = this.resourceMonitor.getCurrentMemoryUsage();
      const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(1);
      this.logger.debug(`📊 [${queueName}] Jobs processed: ${this.jobsProcessed}, Memory: ${heapUsedMB}MB`);
    }
  }

  private isHeavyJob(job: Job): boolean {
    const jobData = job.data as JobData;
    const heavyJobThreshold = parseInt(process.env.WORKER_HEAVY_JOB_THRESHOLD || '10000', 10);

    const heavyPatterns = [
      '/reports/',
      '/database-performance/',
      '/load-test/',
      '/atomic-enrollment/',
    ];

    const isHeavyUrl = heavyPatterns.some((pattern) => jobData.url?.includes(pattern));
    const hasLargePayload = jobData.data && JSON.stringify(jobData.data).length > heavyJobThreshold;

    return isHeavyUrl || hasLargePayload;
  }

  private maybeForceGarbageCollection(): boolean {
    const now = Date.now();
    const timeSinceLastGC = now - this.lastGCTime;
    const gcInterval = parseInt(process.env.WORKER_GC_INTERVAL || '30000', 10);

    if (timeSinceLastGC > gcInterval) {
      this.lastGCTime = now;
      const gcResult = this.resourceMonitor.forceGarbageCollection();

      if (gcResult) {
        this.logger.debug(`♻️ Forced garbage collection after ${this.heavyJobsProcessed} heavy jobs`);
      }

      return gcResult;
    }

    return false;
  }

  // Cache methods (simplified versions)
  private async tryGetFromCache(jobData: JobData): Promise<any | null> {
    try {
      const cacheKey = this.cacheKeyBuilder.forHttpRequest(
        jobData.method,
        jobData.url,
        this.extractQueryParams(jobData.url),
        jobData.userId,
      );

      if (!cacheKey) return null;

      const cachedResult = await this.cacheService.get(cacheKey);
      
      if (cachedResult) {
        this.logger.debug(`🎯 Cache HIT for ${jobData.method} ${jobData.url}`);
        return { ...cachedResult, _cache: { hit: true, key: cacheKey, timestamp: new Date().toISOString() } };
      }

      return null;
    } catch (error) {
      this.logger.warn(`Cache read error: ${error.message}`);
      return null;
    }
  }

  private async tryStoreInCache(jobData: JobData, result: any): Promise<void> {
    try {
      const cacheKey = this.cacheKeyBuilder.forHttpRequest(
        jobData.method,
        jobData.url,
        this.extractQueryParams(jobData.url),
        jobData.userId,
      );

      if (!cacheKey) return;

      const ttl = this.cacheKeyBuilder.getTtlForUrl(jobData.url);
      const cacheableResult = this.prepareCacheableResult(result);
      await this.cacheService.set(cacheKey, cacheableResult, ttl);

      this.logger.debug(`💾 Cached result for ${jobData.method} ${jobData.url} (TTL: ${ttl}ms)`);
    } catch (error) {
      this.logger.warn(`Cache write error: ${error.message}`);
    }
  }

  private extractQueryParams(url: string): Record<string, any> | undefined {
    try {
      const urlObj = new URL(url, 'http://dummy.com');
      const params: Record<string, any> = {};
      
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      return Object.keys(params).length > 0 ? params : undefined;
    } catch {
      return undefined;
    }
  }

  private prepareCacheableResult(result: any): any {
    try {
      const cacheable = JSON.parse(JSON.stringify(result));
      
      // Remove sensitive information
      if (cacheable.token) delete cacheable.token;
      if (cacheable.password) delete cacheable.password;
      if (cacheable.jwt) delete cacheable.jwt;

      // Add cache metadata
      cacheable._cache = {
        cached: true,
        cachedAt: new Date().toISOString(),
        version: '1.0',
      };

      return cacheable;
    } catch {
      return result;
    }
  }

  /**
   * Get worker statistics showing multiple workers per queue
   */
  getWorkerStats() {
    const memoryHealth = this.resourceMonitor.getHealthStatus();
    const poolHealth = this.connectionPool.getHealthStatus();
    const currentMemory = this.resourceMonitor.getCurrentMemoryUsage();

    // Calculate worker details per queue
    const workerDetails: Record<string, any> = {};
    let totalWorkers = 0;

    this.workers.forEach((workersArray, queueName) => {
      const queueDef = this.queueService.getQueueDefinition(queueName);
      workerDetails[queueName] = {
        count: workersArray.length,
        concurrency: queueDef?.concurrency || 1,
        totalConcurrency: workersArray.length * (queueDef?.concurrency || 1),
      };
      totalWorkers += workersArray.length;
    });

    return {
      workers: {
        total: totalWorkers,
        queues: workerDetails,
        active: Array.from(this.workers.keys()),
      },
      jobs: {
        totalProcessed: this.jobsProcessed,
        heavyJobsProcessed: this.heavyJobsProcessed,
      },
      memory: {
        status: memoryHealth.status,
        heapUsedMB: (currentMemory.heapUsed / 1024 / 1024).toFixed(1),
        heapTotalMB: (currentMemory.heapTotal / 1024 / 1024).toFixed(1),
        usagePercent: this.resourceMonitor.getMemoryUsagePercentage().toFixed(1),
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

  /**
   * Add workers for new queue (for runtime configuration updates)
   */
  async addWorkerForQueue(queueName: string) {
    if (this.workers.has(queueName)) {
      this.logger.warn(`⚠️ Workers for queue '${queueName}' already exist`);
      return;
    }

    await this.createWorkerForQueue(queueName);
    const workers = this.workers.get(queueName);
    const workerCount = workers ? workers.length : 0;
    
    this.logger.log(`✅ ${workerCount} dynamic workers added for queue '${queueName}'`);
  }

  /**
   * Remove all workers for a queue (for runtime configuration updates)
   */
  async removeWorkerForQueue(queueName: string) {
    const workers = this.workers.get(queueName);
    
    if (!workers || workers.length === 0) {
      this.logger.warn(`⚠️ No workers found for queue '${queueName}'`);
      return;
    }

    // Close all workers for this queue
    await Promise.all(workers.map(worker => worker.close()));
    this.workers.delete(queueName);
    
    this.logger.log(`🔴 ${workers.length} workers for queue '${queueName}' removed`);
  }

  /**
   * Reload workers (for configuration updates)
   */
  async reloadWorkers() {
    this.logger.log('🔄 Reloading all workers...');
    
    // Close all existing workers
    await this.onModuleDestroy();
    this.workers.clear();
    
    // Reinitialize workers
    await this.initializeWorkers();
    
    this.logger.log('✅ Workers reloaded successfully');
  }

  /**
   * 📊 Get cache statistics (for monitoring)
   */
  async getCacheStats() {
    try {
      return await this.cacheService.getStats();
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * 🧹 Clear cache manually (for debugging/maintenance)
   */
  async clearCache(): Promise<void> {
    try {
      await this.cacheService.clear();
      this.logger.log('🧹 Cache cleared manually');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * 🧹 Perform resource cleanup
   */
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