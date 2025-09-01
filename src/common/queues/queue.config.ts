import { QueueOptions, ConnectionOptions } from 'bullmq';

const bullmqRedisConfig: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),

  // Configuración según variables de entorno
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
  lazyConnect: true,
  
  // Pool de conexiones para alta concurrencia
  family: 4,
  
  // Buffer size optimizado
  enableReadyCheck: false,
};

const baseQueueConfig: QueueOptions = {
  connection: bullmqRedisConfig,

  defaultJobOptions: {
    // Configuración basada en variables de entorno
    removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || '100', 10),
    removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL || '50', 10),
    attempts: parseInt(process.env.QUEUE_STANDARD_ATTEMPTS || '2', 10),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    },
  },
};

export const criticalQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: parseInt(process.env.QUEUE_CRITICAL_ATTEMPTS || '3', 10),
    delay: parseInt(process.env.QUEUE_CRITICAL_DELAY || '0', 10),
  },
};

export const standardQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: parseInt(process.env.QUEUE_STANDARD_ATTEMPTS || '2', 10),
    delay: parseInt(process.env.QUEUE_STANDARD_DELAY || '100', 10),
  },
};

export const backgroundQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: parseInt(process.env.QUEUE_BACKGROUND_ATTEMPTS || '1', 10),
    delay: parseInt(process.env.QUEUE_BACKGROUND_DELAY || '1000', 10),
  },
};

export const QUEUE_NAMES = {
  CRITICAL: 'critical-queue',
  STANDARD: 'standard-queue',
  BACKGROUND: 'background-queue',
} as const;

export const QUEUE_TIMEOUTS = {
  CRITICAL: parseInt(process.env.QUEUE_CRITICAL_TIMEOUT || '30', 10),
  STANDARD: parseInt(process.env.QUEUE_STANDARD_TIMEOUT || '60', 10),
  BACKGROUND: parseInt(process.env.QUEUE_BACKGROUND_TIMEOUT || '120', 10),
} as const;
