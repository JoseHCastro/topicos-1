import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { 
  criticalQueueConfig, 
  standardQueueConfig, 
  backgroundQueueConfig,
  QUEUE_NAMES,
  QUEUE_TIMEOUTS 
} from './queue.config';
import { RedisService } from '../redis/redis.service';

export interface JobData {
  id: string;
  method: string;
  url: string;
  body?: any;
  headers?: any;
  userId?: string;
  timestamp: number;
}

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  timeout?: number;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  
  // Las 3 colas básicas
  private criticalQueue: Queue;
  private standardQueue: Queue;
  private backgroundQueue: Queue;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    try {
      this.criticalQueue = new Queue(QUEUE_NAMES.CRITICAL, criticalQueueConfig);
      this.standardQueue = new Queue(QUEUE_NAMES.STANDARD, standardQueueConfig);
      this.backgroundQueue = new Queue(QUEUE_NAMES.BACKGROUND, backgroundQueueConfig);

      this.setupQueueEventListeners();
      
    } catch (error) {
      this.logger.error('❌ Error initializing queues:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await Promise.all([
      this.criticalQueue?.close(),
      this.standardQueue?.close(),
      this.backgroundQueue?.close(),
    ]);
    this.logger.log('All queues closed');
  }

  private setupQueueEventListeners() {
    const queues = [
      { queue: this.criticalQueue, name: 'CRITICAL' },
      { queue: this.standardQueue, name: 'STANDARD' },
      { queue: this.backgroundQueue, name: 'BACKGROUND' },
    ];

    queues.forEach(({ queue, name }) => {
      queue.on('waiting', (job) => {
        this.logger.debug(`📥 [${name}] Job ${job.id} waiting`);
      });

      // BullMQ usa eventos diferentes para jobs activos, completados y fallidos
      // Estos eventos se manejan mejor en los workers
      this.logger.log(`🎯 [${name}] Queue event listeners configured`);
    });
  }

  async addCriticalJob(jobData: JobData, options?: QueueJobOptions) {
    const job = await this.criticalQueue.add(
      'process-request',
      jobData,
      {
        ...options,
        jobId: jobData.id,
      }
    );
    
    return job;
  }

  async addStandardJob(jobData: JobData, options?: QueueJobOptions) {
    const job = await this.standardQueue.add(
      'process-request',
      jobData,
      {
        ...options,
        jobId: jobData.id,
      }
    );
    
    this.logger.log(`📥 Standard job ${job.id} queued`);
    return job;
  }

  async addBackgroundJob(jobData: JobData, options?: QueueJobOptions) {
    const job = await this.backgroundQueue.add(
      'process-request',
      jobData,
      {
        ...options,
        jobId: jobData.id,
      }
    );
    
    this.logger.log(`📥 Background job ${job.id} queued`);
    return job;
  }

  async getJobStatus(jobId: string) {
    const job = await this.findJobInQueues(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    
    // Si el job está completado, buscar el resultado en Redis
    let result = null;
    let error = null;
    
    if (state === 'completed' || state === 'failed') {
      try {
        const resultKey = `job:result:${jobId}`;
        const resultData = await this.redisService.get(resultKey);
        
        if (resultData) {
          const parsed = JSON.parse(resultData);
          result = parsed.result;
          error = parsed.error;
        }
      } catch (err) {
        this.logger.error(`Error fetching job result from Redis: ${err.message}`);
      }
    }
    
    return {
      id: job.id,
      status: state,
      progress: job.progress,
      data: job.data,
      result: result,
      error: error,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  private async findJobInQueues(jobId: string) {
    const queues = [this.criticalQueue, this.standardQueue, this.backgroundQueue];
    
    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return job;
      }
    }
    
    return null;
  }

  async getQueuesStats() {
    const [criticalStats, standardStats, backgroundStats] = await Promise.all([
      this.criticalQueue.getWaiting(),
      this.standardQueue.getWaiting(),
      this.backgroundQueue.getWaiting(),
    ]);

    return {
      critical: {
        name: QUEUE_NAMES.CRITICAL,
        waiting: criticalStats.length,
        timeout: QUEUE_TIMEOUTS.CRITICAL,
      },
      standard: {
        name: QUEUE_NAMES.STANDARD,
        waiting: standardStats.length,
        timeout: QUEUE_TIMEOUTS.STANDARD,
      },
      background: {
        name: QUEUE_NAMES.BACKGROUND,
        waiting: backgroundStats.length,
        timeout: QUEUE_TIMEOUTS.BACKGROUND,
      },
    };
  }

  getCriticalQueue(): Queue {
    return this.criticalQueue;
  }

  getStandardQueue(): Queue {
    return this.standardQueue;
  }

  getBackgroundQueue(): Queue {
    return this.backgroundQueue;
  }
}