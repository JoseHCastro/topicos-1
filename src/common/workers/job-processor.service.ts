import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobData } from '../interceptors/interfaces/job-data.interface';
import { QueueDefinition } from '../queues/queue-config.interface';
import { RedisService } from '../redis/redis.service';
import { HttpExecutorService } from './http-executor.service';
import { JobCacheService } from './job-cache.service';
import {
  CacheMetadata,
  JobErrorInfo,
  JobErrorType,
  JobResultRecord,
} from './interfaces/job-result.interface';

@Injectable()
export class JobProcessorService {
  private readonly logger = new Logger(JobProcessorService.name);
  private readonly resultHistoryLimit: number;
  private readonly resultTtlSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly httpExecutor: HttpExecutorService,
    private readonly cache: JobCacheService,
  ) {
    this.resultHistoryLimit = this.resolveNumberFromEnv(
      'QUEUE_RESULT_HISTORY_LIMIT',
      100,
      1,
    );
    this.resultTtlSeconds = this.resolveNumberFromEnv('QUEUE_RESULT_TTL', 86400, 60);
  }

  async processJob(
    job: Job,
    queueName: string,
    queueDef: QueueDefinition,
    workerId?: number,
  ): Promise<any> {
    const jobData = job.data as JobData;
    const timeoutMs = Math.max(1, (queueDef.timeout ?? 60) * 1000);
    const workerInfo = workerId ? ` [Worker #${workerId}]` : '';

    this.logger.log(
      `dY"< [${queueName}]${workerInfo} Processing job ${job.id}: ${jobData.method} ${jobData.url}`,
    );

    try {
      let result = await this.cache.tryGetFromCache(jobData);

      if (result) {
        this.logger.log(
          `dY'" [${queueName}]${workerInfo} Job ${job.id} served from CACHE`,
        );

        const errorInfo = this.isSuccessfulResult(result)
          ? null
          : this.buildHttpErrorInfo(result);
        await this.saveJobResult(job, queueName, jobData, workerId, result, errorInfo);

        if (errorInfo) {
          this.logger.warn(
            `??O [${queueName}]${workerInfo} Cached job ${job.id} contains non-success response (${result?.statusCode ?? 'unknown'})`,
          );
        }

        return result;
      }

      this.logger.debug(
        `dY", [${queueName}]${workerInfo} Cache miss - executing job ${job.id}`,
      );

      const shouldExecuteReal = this.shouldExecuteRealRequest(jobData);
      const executionMode = shouldExecuteReal ? 'REAL' : 'SAFE';
      this.logger.log(
        `dYO? [${queueName}]${workerInfo} Executing ${executionMode} HTTP request for job ${job.id}`,
      );

      result = await Promise.race([
        this.httpExecutor.executeRequest(jobData),
        this.createTimeoutPromise(timeoutMs),
      ]);

      this.cache
        .tryStoreInCache(jobData, result)
        .catch((cacheError: Error) => {
          this.logger.warn(
            `Cache store failed for job ${job.id}: ${cacheError.message}`,
          );
        });

      const errorInfo = this.isSuccessfulResult(result)
        ? null
        : this.buildHttpErrorInfo(result);

      await this.saveJobResult(job, queueName, jobData, workerId, result, errorInfo);

      if (errorInfo) {
        this.logger.warn(
          `??O [${queueName}]${workerInfo} Job ${job.id} completed with non-success response (${result?.statusCode ?? 'unknown'})`,
        );
      } else {
        this.logger.log(
          `?o. [${queueName}]${workerInfo} Job ${job.id} completed successfully`,
        );
      }

      return result;
    } catch (error) {
      const normalizedError = this.normalizeError(error);

      this.logger.error(
        `??O [${queueName}]${workerInfo} Job ${job.id} failed: ${normalizedError.message}`,
      );

      await this.saveJobResult(job, queueName, jobData, workerId, null, normalizedError);

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

  private shouldExecuteRealRequest(jobData: JobData): boolean {
    const executeReal = process.env.QUEUE_EXECUTE_REAL === 'true';

    if (!executeReal) {
      return false;
    }

    const safeEndpoints = [
      '/auth/register',
      '/auth/login',
      '/auth/users',
      '/courses',
      '/programs',
      '/enrollments',
      '/schedules',
      '/facilities',
      '/assessments',
      '/calendar',
    ];

    const forbiddenEndpoints = [
      '/admin/',
      '/queue-admin/',
      '/queues/',
      '/health',
      '/metrics',
      '/monitoring',
    ];

    if (forbiddenEndpoints.some((pattern) => jobData.url.includes(pattern))) {
      return false;
    }

    return safeEndpoints.some((pattern) => jobData.url.includes(pattern));
  }

  private async saveJobResult(
    job: Job,
    queueName: string,
    jobData: JobData,
    workerId: number | undefined,
    result: any,
    error: JobErrorInfo | null,
  ): Promise<void> {
    const jobId = job.id ?? undefined;

    if (!jobId) {
      this.logger.warn('Missing job id when trying to persist job result');
      return;
    }

    const success = !error && this.isSuccessfulResult(result);
    const status: 'completed' | 'failed' = success ? 'completed' : 'failed';

    const record: JobResultRecord = {
      jobId,
      queueName,
      method: jobData.method,
      url: jobData.url,
      status,
      success,
      statusCode: typeof result?.statusCode === 'number' ? result.statusCode : error?.statusCode,
      responseBody: result?.data,
      responseHeaders: result?.headers,
      executedAt: result?.executedAt,
      requestBody: jobData.data,
      query: jobData.queryParams,
      cache: this.extractCacheMeta(result),
      error: error ?? null,
      attemptsMade: job.attemptsMade,
      finishedAt: new Date().toISOString(),
      workerId,
      result: result,
    };

    const payload = JSON.stringify(record);
    const resultKey = `job:result:${jobId}`;
    const listKey = success
      ? 'jobs:history:completed'
      : 'jobs:history:failed';

    try {
      await this.redisService.set(resultKey, payload, this.resultTtlSeconds);
      await this.redisService.lpush(listKey, payload);

      if (this.resultHistoryLimit > 0) {
        await this.redisService.ltrim(listKey, 0, this.resultHistoryLimit - 1);
      }

      this.logger.debug(`dY'_ Job result saved in Redis: ${resultKey}`);
    } catch (redisError: any) {
      this.logger.error(
        `??O Failed to persist job result in Redis for ${jobId}: ${redisError?.message ?? redisError}`,
      );
    }
  }

  private isSuccessfulResult(result: any): boolean {
    if (!result) {
      return false;
    }

    if (typeof result.success === 'boolean') {
      return result.success;
    }

    if (typeof result.statusCode === 'number') {
      return result.statusCode >= 200 && result.statusCode < 400;
    }

    return true;
  }

  private buildHttpErrorInfo(result: any): JobErrorInfo {
    const statusCode = typeof result?.statusCode === 'number' ? result.statusCode : undefined;
    const message = statusCode
      ? `Request finished with status ${statusCode}`
      : 'Request finished without success flag';

    return {
      message,
      statusCode,
      data: result?.data,
      type: 'http',
    };
  }

  private normalizeError(error: unknown): JobErrorInfo {
    if (error instanceof Error) {
      const type: JobErrorType = error.name === 'AbortError' ? 'timeout' : 'exception';
      const info: JobErrorInfo = {
        message: error.message,
        type,
        stack: error.stack,
      };

      const maybeStatus = (error as any)?.statusCode;
      if (typeof maybeStatus === 'number') {
        info.statusCode = maybeStatus;
      }

      const maybeData = (error as any)?.response?.data ?? (error as any)?.data;
      if (maybeData !== undefined) {
        info.data = maybeData;
      }

      return info;
    }

    if (typeof error === 'string') {
      return { message: error, type: 'unknown' };
    }

    if (error && typeof error === 'object') {
      return {
        message: JSON.stringify(error),
        type: 'unknown',
      };
    }

    return { message: 'Unknown error', type: 'unknown' };
  }

  private extractCacheMeta(result: any): CacheMetadata | null {
    if (!result || typeof result !== 'object') {
      return null;
    }

    const cache = (result as any)._cache;
    if (!cache || typeof cache !== 'object') {
      return null;
    }

    const hit = Boolean(cache.hit ?? cache.cached ?? false);
    const key = typeof cache.key === 'string' ? cache.key : undefined;
    let timestamp: string | undefined;

    if (typeof cache.timestamp === 'string') {
      timestamp = cache.timestamp;
    } else if (typeof cache.cachedAt === 'string') {
      timestamp = cache.cachedAt;
    }

    return {
      hit,
      key,
      timestamp,
    };
  }

  private resolveNumberFromEnv(
    key: string,
    defaultValue: number,
    minValue: number,
  ): number {
    const raw = process.env[key];

    if (!raw) {
      return defaultValue;
    }

    const parsed = parseInt(raw, 10);

    if (Number.isNaN(parsed) || parsed < minValue) {
      return defaultValue;
    }

    return parsed;
  }
}
