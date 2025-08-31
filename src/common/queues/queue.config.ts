import { QueueOptions, ConnectionOptions } from 'bullmq';

const bullmqRedisConfig: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),

  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
  lazyConnect: true,
};

const baseQueueConfig: QueueOptions = {
  connection: bullmqRedisConfig,

  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

export const criticalQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: 3,
    delay: 0,
  },
};

export const standardQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: 2,
    delay: 100,
  },
};

export const backgroundQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: 1,
    delay: 1000,
  },
};

export const QUEUE_NAMES = {
  CRITICAL: 'critical-queue',
  STANDARD: 'standard-queue',
  BACKGROUND: 'background-queue',
} as const;

export const QUEUE_TIMEOUTS = {
  CRITICAL: 30,
  STANDARD: 60,
  BACKGROUND: 120,
} as const;
