import { QueueOptions, ConnectionOptions } from 'bullmq';

const bullmqRedisConfig: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),

  // OPTIMIZADO PARA 100K REQUESTS
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  lazyConnect: true,
  
  // Pool de conexiones para alta concurrencia
  family: 4,
  keepAlive: true,
  maxLoadingTimeout: 5000,
  
  // Buffer size optimizado
  enableReadyCheck: false,
  dropBufferSupport: false,
};

const baseQueueConfig: QueueOptions = {
  connection: bullmqRedisConfig,

  defaultJobOptions: {
    // OPTIMIZADO PARA DEMO DE 100K
    removeOnComplete: 100,  // Mantener más jobs completados para métricas
    removeOnFail: 50,       // Mantener más jobs fallidos para debugging
    attempts: 2,            // Reducir intentos para demo rápida
    backoff: {
      type: 'exponential',
      delay: 1000,          // Delay más rápido
    },
    // TTL más largo para demo
    ttl: 3600000,           // 1 hora
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
