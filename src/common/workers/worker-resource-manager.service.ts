import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobData } from '../interceptors/interfaces/job-data.interface';
import { ResourceMonitorService } from '../monitoring/resource-monitor.service';
import { ConnectionPoolService } from '../monitoring/connection-pool.service';

@Injectable()
export class WorkerResourceManagerService {
  private readonly logger = new Logger(WorkerResourceManagerService.name);

  private heavyJobsProcessed = 0;
  private lastGCTime = Date.now();

  constructor(
    private readonly resourceMonitor: ResourceMonitorService,
    private readonly connectionPool: ConnectionPoolService,
  ) {}

  setupResourceMonitoring() {
    this.resourceMonitor.on('memory-critical', (data) => {
      this.logger.error(`🚨 [WORKER] Memory critical: ${data.heapUsedMB}MB / ${data.limit}MB`);
    });

    this.resourceMonitor.on('memory-warning', (data) => {
      this.logger.warn(`⚠️ [WORKER] Memory warning: ${data.heapUsedMB}MB / ${data.limit}MB`);
      this.maybeForceGarbageCollection();
    });

    this.resourceMonitor.on('memory-normal', (data) => {
      this.logger.log(`✅ [WORKER] Memory usage normalized: ${data.heapUsedMB}MB`);
    });
  }

  checkResourcesAfterJob(job: Job, queueName: string, totalJobsProcessed: number) {
    const isHeavyJob = this.isHeavyJob(job);

    if (isHeavyJob) {
      this.heavyJobsProcessed++;
      this.logger.debug(`🏋️ Heavy job ${job.id} completed (total: ${this.heavyJobsProcessed})`);
      this.maybeForceGarbageCollection();
    }

    // Log memory every 10 jobs in development
    if (process.env.NODE_ENV === 'development' && totalJobsProcessed % 10 === 0) {
      const memoryUsage = this.resourceMonitor.getCurrentMemoryUsage();
      const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(1);
      this.logger.debug(`📊 [${queueName}] Jobs processed: ${totalJobsProcessed}, Memory: ${heapUsedMB}MB`);
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

  async performResourceCleanup(): Promise<{ success: boolean; details: any }> {
    try {
      const beforeMemory = this.resourceMonitor.getCurrentMemoryUsage();

      // 1. Force garbage collection
      const gcResult = this.resourceMonitor.forceGarbageCollection();

      // 2. Clean idle connections
      await this.connectionPool.cleanupIdleConnections();

      // 3. Test connection
      const connectionTest = await this.connectionPool.testConnection();

      const afterMemory = this.resourceMonitor.getCurrentMemoryUsage();
      const memoryFreedMB = (beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024;

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

  getHeavyJobsProcessed(): number {
    return this.heavyJobsProcessed;
  }
}