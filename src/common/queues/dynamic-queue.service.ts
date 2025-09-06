import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { JobData } from '../interceptors/interfaces/job-data.interface';
import { 
  QueueSystemConfig, 
  QueueDefinition, 
  loadQueueConfig 
} from './queue-config.interface';

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  timeout?: number;
}

@Injectable()
export class DynamicQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamicQueueService.name);
  
  // Dynamic queue storage
  private queues: Map<string, Queue> = new Map();
  private queueConfig: QueueSystemConfig;
  private queueDefinitions: Map<string, QueueDefinition> = new Map();

  constructor(private readonly redisService: RedisService) {
    // Load configuration on construction
    this.queueConfig = loadQueueConfig();
    this.logger.log(`📋 Loaded configuration for ${this.queueConfig.queues.length} queues`);
  }

  async onModuleInit() {
    try {
      await this.initializeQueues();
      this.setupQueueEventListeners();
      this.logger.log(`🚀 ${this.queues.size} dynamic queues initialized successfully`);
    } catch (error) {
      this.logger.error('❌ Error initializing dynamic queues:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.logger.log(`🔴 All ${this.queues.size} queues closed`);
  }

  /**
   * Initialize all queues from configuration
   */
  private async initializeQueues() {
    for (const queueDef of this.queueConfig.queues) {
      if (!queueDef.enabled) {
        this.logger.debug(`⚪ Skipping disabled queue: ${queueDef.name}`);
        continue;
      }

      try {
        const queueConfig = this.buildQueueConfig(queueDef);
        const queue = new Queue(queueDef.name, queueConfig);
        
        this.queues.set(queueDef.name, queue);
        this.queueDefinitions.set(queueDef.name, queueDef);
        
        this.logger.log(`✅ Queue '${queueDef.name}' initialized (concurrency: ${queueDef.concurrency})`);
      } catch (error) {
        this.logger.error(`❌ Failed to initialize queue '${queueDef.name}':`, error);
        throw error;
      }
    }
  }

  /**
   * Build BullMQ configuration from queue definition
   */
  private buildQueueConfig(queueDef: QueueDefinition) {
    return {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
        lazyConnect: true,
        family: 4,
        enableReadyCheck: false,
      },
      defaultJobOptions: {
        removeOnComplete: queueDef.removeOnComplete || 100,
        removeOnFail: queueDef.removeOnFail || 50,
        attempts: queueDef.attempts,
        backoff: {
          type: 'exponential',
          delay: queueDef.retryDelay,
        },
        delay: queueDef.processingDelay || 0,
      },
    };
  }

  /**
   * Setup event listeners for all queues
   */
  private setupQueueEventListeners() {
    this.queues.forEach((queue, queueName) => {
      queue.on('waiting', (job) => {
        this.logger.debug(`📥 [${queueName}] Job ${job.id} waiting`);
      });

      queue.on('error', (error) => {
        this.logger.error(`💥 [${queueName}] Queue error:`, error);
      });

      this.logger.debug(`🎯 [${queueName}] Event listeners configured`);
    });
  }

  /**
   * Add job to specific queue
   */
  async addJobToQueue(queueName: string, jobData: JobData, options?: QueueJobOptions) {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const queueDef = this.queueDefinitions.get(queueName);
    
    const job = await queue.add('process-request', jobData, {
      ...options,
      jobId: jobData.id,
      priority: options?.priority || queueDef?.priority || 1,
    });

    this.logger.log(`📥 Job ${job.id} queued in '${queueName}' queue`);
    return job;
  }

  /**
   * Determine which queue to use based on URL
   */
  determineQueueForUrl(url: string): string {
    // Check each queue's URL patterns
    for (const queueDef of this.queueConfig.queues) {
      if (!queueDef.enabled) continue;
      
      for (const pattern of queueDef.urlPatterns) {
        if (this.matchesPattern(url, pattern)) {
          this.logger.debug(`🎯 URL '${url}' matched pattern '${pattern}' → queue '${queueDef.name}'`);
          return queueDef.name;
        }
      }
    }

    // Fallback to default queue
    this.logger.debug(`🎯 URL '${url}' no pattern match → default queue '${this.queueConfig.defaultQueue}'`);
    return this.queueConfig.defaultQueue;
  }

  /**
   * Match URL against pattern (supports wildcards)
   */
  private matchesPattern(url: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      // Wildcard pattern: /api/users/* matches /api/users/123
      const prefix = pattern.slice(0, -2);
      return url.startsWith(prefix);
    }
    
    // Exact match
    return url === pattern;
  }

  /**
   * Get job status from any queue
   */
  async getJobStatus(jobId: string) {
    // Search job in all queues
    for (const [queueName, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        
        // Get result from Redis if completed
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
          queueName,
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
    }

    return null; // Job not found in any queue
  }

  /**
   * Get statistics for all queues
   */
  async getQueuesStats() {
    const stats: Record<string, any> = {};
    
    for (const [queueName, queue] of this.queues) {
      const queueDef = this.queueDefinitions.get(queueName);
      const waiting = await queue.getWaiting();
      
      stats[queueName] = {
        name: queueName,
        displayName: queueDef?.displayName || queueName,
        waiting: waiting.length,
        timeout: queueDef?.timeout || 60,
        priority: queueDef?.priority || 1,
        concurrency: queueDef?.concurrency || 1,
        enabled: queueDef?.enabled || false,
        estimatedTime: queueDef?.estimatedTime || 'Unknown',
      };
    }

    return {
      queues: stats,
      timestamp: new Date().toISOString(),
      totalQueues: this.queues.size,
      defaultQueue: this.queueConfig.defaultQueue,
    };
  }

  /**
   * Get queue configuration
   */
  getQueueConfig(): QueueSystemConfig {
    return this.queueConfig;
  }

  /**
   * Get specific queue definition
   */
  getQueueDefinition(queueName: string): QueueDefinition | undefined {
    return this.queueDefinitions.get(queueName);
  }

  /**
   * Get all available queue names
   */
  getAvailableQueues(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Check if queue exists and is enabled
   */
  isQueueAvailable(queueName: string): boolean {
    return this.queues.has(queueName);
  }

  /**
   * Get queue instance (for workers)
   */
  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Reload configuration and reinitialize queues
   * Useful for runtime configuration updates
   */
  async reloadConfiguration() {
    this.logger.log('🔄 Reloading queue configuration...');
    
    // Close existing queues
    await this.onModuleDestroy();
    
    // Clear maps
    this.queues.clear();
    this.queueDefinitions.clear();
    
    // Reload config and reinitialize
    this.queueConfig = loadQueueConfig();
    await this.onModuleInit();
    
    this.logger.log('✅ Queue configuration reloaded successfully');
  }
}