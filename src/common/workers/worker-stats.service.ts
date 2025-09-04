import { Injectable, Logger } from '@nestjs/common';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { ResourceMonitorService } from '../monitoring/resource-monitor.service';
import { ConnectionPoolService } from '../monitoring/connection-pool.service';
import { WorkerInfo } from './worker-factory.service';

@Injectable()
export class WorkerStatsService {
  private readonly logger = new Logger(WorkerStatsService.name);
  private jobsProcessed = 0;
  private jobsCompleted = 0;
  private jobsFailed = 0;
  private jobsByQueue: Record<string, { completed: number; failed: number }> = {};

  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly resourceMonitor: ResourceMonitorService,
    private readonly connectionPool: ConnectionPoolService,
  ) {}

  incrementJobsProcessed(): void {
    this.jobsProcessed++;
  }

  recordJobCompleted(queueName: string, jobId: string): void {
    this.jobsCompleted++;
    this.initializeQueueStats(queueName);
    this.jobsByQueue[queueName].completed++;
    this.logger.debug(`✅ Job ${jobId} completed in queue '${queueName}'`);
  }

  recordJobFailed(queueName: string, jobId: string, error: string): void {
    this.jobsFailed++;
    this.initializeQueueStats(queueName);
    this.jobsByQueue[queueName].failed++;
    this.logger.debug(`❌ Job ${jobId} failed in queue '${queueName}': ${error}`);
  }

  private initializeQueueStats(queueName: string): void {
    if (!this.jobsByQueue[queueName]) {
      this.jobsByQueue[queueName] = { completed: 0, failed: 0 };
    }
  }

  getJobStatistics() {
    return {
      total: this.jobsProcessed,
      completed: this.jobsCompleted,
      failed: this.jobsFailed,
      successRate: this.jobsProcessed > 0 ? (this.jobsCompleted / this.jobsProcessed * 100).toFixed(2) : '0',
      byQueue: this.jobsByQueue,
    };
  }

  getDetailedWorkerStats(workers: WorkerInfo[]) {
    const workersByQueue: Record<string, number> = {};
    const activeWorkers = workers.filter(w => w.status === 'active');
    
    workers.forEach(worker => {
      workersByQueue[worker.queueName] = (workersByQueue[worker.queueName] || 0) + 1;
    });

    const memoryHealth = this.resourceMonitor.getHealthStatus();
    const poolHealth = this.connectionPool.getHealthStatus();
    const currentMemory = this.resourceMonitor.getCurrentMemoryUsage();

    return {
      workers: {
        total: workers.length,
        active: activeWorkers.length,
        byQueue: workersByQueue,
        details: workers.map(w => ({
          id: w.id,
          queueName: w.queueName,
          strategy: w.strategy,
          concurrency: w.concurrency,
          status: w.status,
          createdAt: w.createdAt,
        })),
      },
      jobs: this.getJobStatistics(),
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
      timestamp: new Date().toISOString(),
    };
  }

  getWorkerStats(workers: Map<string, any[]>, heavyJobsProcessed: number) {
    const memoryHealth = this.resourceMonitor.getHealthStatus();
    const poolHealth = this.connectionPool.getHealthStatus();
    const currentMemory = this.resourceMonitor.getCurrentMemoryUsage();

    // Calculate worker details per queue
    const workerDetails: Record<string, any> = {};
    let totalWorkers = 0;

    workers.forEach((workersArray, queueName) => {
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
        active: Array.from(workers.keys()),
      },
      jobs: {
        totalProcessed: this.jobsProcessed,
        heavyJobsProcessed: heavyJobsProcessed,
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
    };
  }

  getJobsProcessed(): number {
    return this.jobsProcessed;
  }
}