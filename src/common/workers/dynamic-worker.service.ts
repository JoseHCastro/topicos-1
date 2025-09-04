import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { QueueDefinition } from '../queues/queue-config.interface';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { WorkerFactoryService, WorkerInfo } from './worker-factory.service';
import { WorkerResourceManagerService } from './worker-resource-manager.service';
import { WorkerStatsService } from './worker-stats.service';
import { WorkerHealthService } from './worker-health.service';
import { JobCacheService } from './job-cache.service';

// Re-export WorkerInfo for backward compatibility
export { WorkerInfo } from './worker-factory.service';

@Injectable()
export class DynamicWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamicWorkerService.name);
  private workers: Map<string, WorkerInfo> = new Map();
  private isShuttingDown = false;

  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly workerFactory: WorkerFactoryService,
    private readonly resourceManager: WorkerResourceManagerService,
    private readonly statsService: WorkerStatsService,
    private readonly healthService: WorkerHealthService,
    private readonly cacheService: JobCacheService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Initializing Dynamic Worker Service...');
    
    // Setup resource monitoring
    this.resourceManager.setupResourceMonitoring();
    
    // Create workers for all enabled queues
    await this.createWorkersForAllQueues();
    
    this.logger.log(`✅ Dynamic Worker Service initialized with ${this.workers.size} workers`);
  }

  async onModuleDestroy() {
    this.logger.log('🔥 Shutting down Dynamic Worker Service...');
    this.isShuttingDown = true;
    
    // Close all workers gracefully
    const shutdownPromises = Array.from(this.workers.values()).map(
      workerInfo => this.workerFactory.shutdownWorker(workerInfo)
    );
    
    await Promise.all(shutdownPromises);
    this.workers.clear();
    
    this.logger.log('✅ All workers shut down gracefully');
  }

  private async createWorkersForAllQueues(): Promise<void> {
    const config = this.queueService.getQueueConfig();
    
    for (const queueDef of config.queues) {
      if (queueDef.enabled) {
        await this.createWorkersForQueue(queueDef);
      } else {
        this.logger.warn(`⚠️ Queue '${queueDef.name}' is disabled, skipping worker creation`);
      }
    }
  }

  private async createWorkersForQueue(queueDef: QueueDefinition): Promise<void> {
    const workerCount = this.workerFactory.getWorkerCountForQueue(queueDef);
    const strategy = this.workerFactory.getWorkerStrategy();
    
    this.logger.log(
      `🏗️ Creating ${workerCount} worker(s) for queue '${queueDef.name}' using '${strategy}' strategy`
    );

    for (let i = 0; i < workerCount; i++) {
      const workerInfo = await this.workerFactory.createWorker(queueDef, i + 1, strategy);
      this.workers.set(workerInfo.id, workerInfo);
      
      // Setup status change handlers
      this.setupWorkerStatusHandlers(workerInfo);
    }
  }

  private setupWorkerStatusHandlers(workerInfo: WorkerInfo): void {
    const { worker, id } = workerInfo;
    
    worker.on('paused', () => {
      this.healthService.updateWorkerStatus(this.workers, id, 'paused');
    });

    worker.on('resumed', () => {
      this.healthService.updateWorkerStatus(this.workers, id, 'active');
    });

    worker.on('closed', () => {
      this.healthService.updateWorkerStatus(this.workers, id, 'stopped');
    });
  }

  // Public API methods

  async addWorkerForQueue(queueName: string): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Cannot add workers during shutdown');
    }

    const queueDef = this.queueService.getQueueDefinition(queueName);
    if (!queueDef) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    if (!queueDef.enabled) {
      throw new Error(`Queue '${queueName}' is disabled`);
    }

    const workers = Array.from(this.workers.values());
    const existingWorkers = this.healthService.getWorkersForQueue(workers, queueName);
    const maxWorkers = this.workerFactory.getMaxWorkersPerQueue();
    
    this.healthService.validateWorkerLimits(queueName, existingWorkers, maxWorkers);

    const workerNumber = existingWorkers.length + 1;
    const strategy = this.workerFactory.getWorkerStrategy();
    
    const workerInfo = await this.workerFactory.createWorker(queueDef, workerNumber, strategy);
    this.workers.set(workerInfo.id, workerInfo);
    this.setupWorkerStatusHandlers(workerInfo);
    
    this.logger.log(`✅ Added new worker for queue '${queueName}' (total: ${workerNumber})`);
  }

  async removeWorkerForQueue(queueName: string): Promise<void> {
    const workers = Array.from(this.workers.values());
    const queueWorkers = this.healthService.getWorkersForQueue(workers, queueName);
    
    this.healthService.validateQueueHasWorkers(queueName, queueWorkers);

    // Remove the last worker
    const workerToRemove = queueWorkers[queueWorkers.length - 1];
    await this.workerFactory.shutdownWorker(workerToRemove);
    this.workers.delete(workerToRemove.id);
    
    this.logger.log(`✅ Removed worker '${workerToRemove.id}' from queue '${queueName}'`);
  }

  async reloadWorkers(): Promise<void> {
    this.logger.log('🔄 Reloading all workers...');
    
    // Stop all current workers
    const shutdownPromises = Array.from(this.workers.values()).map(
      workerInfo => this.workerFactory.shutdownWorker(workerInfo)
    );
    await Promise.all(shutdownPromises);
    this.workers.clear();

    // Recreate workers with new configuration
    await this.createWorkersForAllQueues();
    
    this.logger.log(`✅ Reloaded workers successfully (${this.workers.size} workers active)`);
  }

  getWorkerStats() {
    const workers = Array.from(this.workers.values());
    return this.statsService.getDetailedWorkerStats(workers);
  }

  async performResourceCleanup(): Promise<{ success: boolean; details: any }> {
    return await this.resourceManager.performResourceCleanup();
  }

  async getCacheStats() {
    return await this.cacheService.getStats();
  }

  async clearCache(): Promise<void> {
    await this.cacheService.clear();
  }

  getHealthStatus(): { status: 'healthy' | 'warning' | 'critical'; details: any } {
    const workers = Array.from(this.workers.values());
    return this.healthService.getHealthStatus(workers);
  }

  // Worker Control Methods for Testing

  async pauseAllWorkers(): Promise<{ success: boolean; details: any }> {
    this.logger.log('⏸️ Pausing all workers...');
    
    try {
      const pausePromises = Array.from(this.workers.values()).map(async (workerInfo) => {
        await workerInfo.worker.pause();
        this.healthService.updateWorkerStatus(this.workers, workerInfo.id, 'paused');
        return workerInfo.id;
      });

      const pausedWorkers = await Promise.all(pausePromises);
      
      this.logger.log(`✅ Paused ${pausedWorkers.length} workers`);
      
      return {
        success: true,
        details: {
          pausedWorkers: pausedWorkers.length,
          workerIds: pausedWorkers,
          message: 'All workers paused - jobs will queue but not process',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error pausing workers: ${error.message}`);
      return {
        success: false,
        details: { error: error.message },
      };
    }
  }

  async resumeAllWorkers(): Promise<{ success: boolean; details: any }> {
    this.logger.log('▶️ Resuming all workers...');
    
    try {
      const resumePromises = Array.from(this.workers.values()).map(async (workerInfo) => {
        await workerInfo.worker.resume();
        this.healthService.updateWorkerStatus(this.workers, workerInfo.id, 'active');
        return workerInfo.id;
      });

      const resumedWorkers = await Promise.all(resumePromises);
      
      this.logger.log(`✅ Resumed ${resumedWorkers.length} workers`);
      
      return {
        success: true,
        details: {
          resumedWorkers: resumedWorkers.length,
          workerIds: resumedWorkers,
          message: 'All workers resumed - processing queued jobs',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error resuming workers: ${error.message}`);
      return {
        success: false,
        details: { error: error.message },
      };
    }
  }

  async pauseWorkersByQueue(queueName: string): Promise<{ success: boolean; details: any }> {
    this.logger.log(`⏸️ Pausing workers for queue '${queueName}'...`);
    
    try {
      const workers = Array.from(this.workers.values());
      const queueWorkers = this.healthService.getWorkersForQueue(workers, queueName);
      
      if (queueWorkers.length === 0) {
        throw new Error(`No workers found for queue '${queueName}'`);
      }

      const pausePromises = queueWorkers.map(async (workerInfo) => {
        await workerInfo.worker.pause();
        this.healthService.updateWorkerStatus(this.workers, workerInfo.id, 'paused');
        return workerInfo.id;
      });

      const pausedWorkers = await Promise.all(pausePromises);
      
      this.logger.log(`✅ Paused ${pausedWorkers.length} workers for queue '${queueName}'`);
      
      return {
        success: true,
        details: {
          queueName,
          pausedWorkers: pausedWorkers.length,
          workerIds: pausedWorkers,
          message: `Workers for queue '${queueName}' paused`,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error pausing workers for queue '${queueName}': ${error.message}`);
      return {
        success: false,
        details: { error: error.message, queueName },
      };
    }
  }

  async resumeWorkersByQueue(queueName: string): Promise<{ success: boolean; details: any }> {
    this.logger.log(`▶️ Resuming workers for queue '${queueName}'...`);
    
    try {
      const workers = Array.from(this.workers.values());
      const queueWorkers = this.healthService.getWorkersForQueue(workers, queueName);
      
      if (queueWorkers.length === 0) {
        throw new Error(`No workers found for queue '${queueName}'`);
      }

      const resumePromises = queueWorkers.map(async (workerInfo) => {
        await workerInfo.worker.resume();
        this.healthService.updateWorkerStatus(this.workers, workerInfo.id, 'active');
        return workerInfo.id;
      });

      const resumedWorkers = await Promise.all(resumePromises);
      
      this.logger.log(`✅ Resumed ${resumedWorkers.length} workers for queue '${queueName}'`);
      
      return {
        success: true,
        details: {
          queueName,
          resumedWorkers: resumedWorkers.length,
          workerIds: resumedWorkers,
          message: `Workers for queue '${queueName}' resumed`,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error resuming workers for queue '${queueName}': ${error.message}`);
      return {
        success: false,
        details: { error: error.message, queueName },
      };
    }
  }

  getWorkersStatus(): { global: string; byQueue: Record<string, { active: number; paused: number; total: number }> } {
    const workers = Array.from(this.workers.values());
    const byQueue: Record<string, { active: number; paused: number; total: number }> = {};
    
    let totalActive = 0;
    let totalPaused = 0;

    workers.forEach(worker => {
      if (!byQueue[worker.queueName]) {
        byQueue[worker.queueName] = { active: 0, paused: 0, total: 0 };
      }
      
      byQueue[worker.queueName].total++;
      
      if (worker.status === 'active') {
        byQueue[worker.queueName].active++;
        totalActive++;
      } else if (worker.status === 'paused') {
        byQueue[worker.queueName].paused++;
        totalPaused++;
      }
    });

    const globalStatus = totalPaused === workers.length ? 'all-paused' : 
                        totalActive === workers.length ? 'all-active' : 'mixed';

    return {
      global: globalStatus,
      byQueue,
    };
  }
}