import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobData } from '../interceptors/interfaces/job-data.interface';
import { QueueDefinition } from '../queues/queue-config.interface';
import { RedisService } from '../redis/redis.service';
import { JobSimulatorService } from './job-simulator.service';
import { JobCacheService } from './job-cache.service';

@Injectable()
export class JobProcessorService {
  private readonly logger = new Logger(JobProcessorService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly simulator: JobSimulatorService,
    private readonly cache: JobCacheService,
  ) {}

  async processJob(
    job: Job, 
    queueName: string, 
    queueDef: QueueDefinition, 
    workerId?: number
  ): Promise<any> {
    const jobData = job.data as JobData;
    const timeout = queueDef.timeout;
    const workerInfo = workerId ? ` [Worker #${workerId}]` : '';

    this.logger.log(
      `📋 [${queueName}]${workerInfo} Processing job ${job.id}: ${jobData.method} ${jobData.url}`,
    );

    try {
      // 1. Try cache first
      let result = await this.cache.tryGetFromCache(jobData);
      
      if (result) {
        this.logger.log(`💨 [${queueName}]${workerInfo} Job ${job.id} served from CACHE`);
        await this.saveJobResult(job.id!, result, null);
        return result;
      }

      // 2. Cache miss - execute request
      this.logger.debug(`🔄 [${queueName}]${workerInfo} Cache miss - executing job ${job.id}`);
      
      // 3. Execute with timeout
      result = await Promise.race([
        this.simulator.executeRequest(jobData),
        this.createTimeoutPromise(timeout * 1000),
      ]);

      // 4. Store in cache (async)
      this.cache.tryStoreInCache(jobData, result).catch(error => {
        this.logger.warn(`Cache store failed for job ${job.id}:`, error.message);
      });

      // 5. Save result in Redis
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
}