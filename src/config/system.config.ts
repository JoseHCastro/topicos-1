import { ConfigService } from '@nestjs/config';

/**
 * 📋 CONFIGURACIÓN CENTRALIZADA DEL SISTEMA DE COLAS
 * 
 * Este archivo centraliza toda la configuración del sistema de colas universal
 * basado en variables de entorno, siguiendo las especificaciones de FASE-2.
 * 
 * Fecha: 31 de agosto de 2025
 */

export interface QueueSystemConfig {
  // Queue Timeouts (en segundos)
  critical: {
    timeout: number;
    attempts: number;
    delay: number;
  };
  standard: {
    timeout: number;
    attempts: number;
    delay: number;
  };
  background: {
    timeout: number;
    attempts: number;
    delay: number;
  };
  // Queue General Settings
  jobTtl: number;
  removeOnComplete: number;
  removeOnFail: number;
}

export interface WorkerConfig {
  maxHeapMB: number;
  maxRssMB: number;
  maxCpuPercent: number;
  concurrency: number;
  workerId: string;
  gcInterval: number;
  heavyJobThreshold: number;
}

export interface MonitoringConfig {
  resourceInterval: number;
  connectionPoolInterval: number;
  healthCheckInterval: number;
  maxStatsHistory: number;
  maxPoolHistory: number;
}

export interface CacheConfig {
  maxEntries: number;
  ttlMinutes: number;
  enabled: boolean;
  cleanupInterval: number;
}

export interface PollingConfig {
  interval: number;
  maxTime: number;
  timeoutRetries: number;
}

export interface RedisConfig {
  connectTimeout: number;
  maxRetries: number;
  retryDelay: number;
  maxLoadingTimeout: number;
}

export interface TransactionConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  maxDelay: number;
}

export interface LoadTestConfig {
  maxWaitTime: number;
  checkInterval: number;
  pauseMs: number;
  heavyPauseMs: number;
}

export interface IdempotencyConfig {
  ttl: number;
  processingTtl: number;
}

export interface LoggingConfig {
  level: string;
  queueOperations: boolean;
  workerStats: boolean;
  resourceUsage: boolean;
}

export interface FeatureFlags {
  enableQueueSystem: boolean;
  enableCache: boolean;
  enableMonitoring: boolean;
}

/**
 * Factory function para crear configuración del sistema de colas
 */
export const createQueueSystemConfig = (configService: ConfigService): QueueSystemConfig => ({
  critical: {
    timeout: parseInt(configService.get('QUEUE_CRITICAL_TIMEOUT', '30'), 10),
    attempts: parseInt(configService.get('QUEUE_CRITICAL_ATTEMPTS', '3'), 10),
    delay: parseInt(configService.get('QUEUE_CRITICAL_DELAY', '0'), 10),
  },
  standard: {
    timeout: parseInt(configService.get('QUEUE_STANDARD_TIMEOUT', '60'), 10),
    attempts: parseInt(configService.get('QUEUE_STANDARD_ATTEMPTS', '2'), 10),
    delay: parseInt(configService.get('QUEUE_STANDARD_DELAY', '100'), 10),
  },
  background: {
    timeout: parseInt(configService.get('QUEUE_BACKGROUND_TIMEOUT', '120'), 10),
    attempts: parseInt(configService.get('QUEUE_BACKGROUND_ATTEMPTS', '1'), 10),
    delay: parseInt(configService.get('QUEUE_BACKGROUND_DELAY', '1000'), 10),
  },
  jobTtl: parseInt(configService.get('QUEUE_JOB_TTL', '3600000'), 10),
  removeOnComplete: parseInt(configService.get('QUEUE_REMOVE_ON_COMPLETE', '100'), 10),
  removeOnFail: parseInt(configService.get('QUEUE_REMOVE_ON_FAIL', '50'), 10),
});

/**
 * Factory function para crear configuración de workers
 */
export const createWorkerConfig = (configService: ConfigService): WorkerConfig => ({
  maxHeapMB: parseInt(configService.get('WORKER_MAX_HEAP_MB', '256'), 10),
  maxRssMB: parseInt(configService.get('WORKER_MAX_RSS_MB', '512'), 10),
  maxCpuPercent: parseInt(configService.get('WORKER_MAX_CPU_PERCENT', '80'), 10),
  concurrency: parseInt(configService.get('WORKER_CONCURRENCY', '1'), 10),
  workerId: configService.get('WORKER_ID', 'main'),
  gcInterval: parseInt(configService.get('WORKER_GC_INTERVAL', '30000'), 10),
  heavyJobThreshold: parseInt(configService.get('WORKER_HEAVY_JOB_THRESHOLD', '10000'), 10),
});

/**
 * Factory function para crear configuración de monitoring
 */
export const createMonitoringConfig = (configService: ConfigService): MonitoringConfig => ({
  resourceInterval: parseInt(configService.get('MONITORING_RESOURCE_INTERVAL', '5000'), 10),
  connectionPoolInterval: parseInt(configService.get('MONITORING_CONNECTION_POOL_INTERVAL', '10000'), 10),
  healthCheckInterval: parseInt(configService.get('MONITORING_HEALTH_CHECK_INTERVAL', '30000'), 10),
  maxStatsHistory: parseInt(configService.get('MONITORING_MAX_STATS_HISTORY', '100'), 10),
  maxPoolHistory: parseInt(configService.get('MONITORING_MAX_POOL_HISTORY', '50'), 10),
});

/**
 * Factory function para crear configuración de cache
 */
export const createCacheConfig = (configService: ConfigService): CacheConfig => ({
  maxEntries: parseInt(configService.get('CACHE_MAX_ENTRIES', '1000'), 10),
  ttlMinutes: parseInt(configService.get('CACHE_TTL_MINUTES', '5'), 10),
  enabled: configService.get('CACHE_ENABLED', 'true') === 'true',
  cleanupInterval: parseInt(configService.get('CACHE_CLEANUP_INTERVAL', '60000'), 10),
});

/**
 * Factory function para crear configuración de polling
 */
export const createPollingConfig = (configService: ConfigService): PollingConfig => ({
  interval: parseInt(configService.get('POLLING_INTERVAL', '2000'), 10),
  maxTime: parseInt(configService.get('POLLING_MAX_TIME', '120000'), 10),
  timeoutRetries: parseInt(configService.get('POLLING_TIMEOUT_RETRIES', '3'), 10),
});

/**
 * Factory function para crear configuración de Redis
 */
export const createRedisConfig = (configService: ConfigService): RedisConfig => ({
  connectTimeout: parseInt(configService.get('REDIS_CONNECT_TIMEOUT', '5000'), 10),
  maxRetries: parseInt(configService.get('REDIS_MAX_RETRIES', '3'), 10),
  retryDelay: parseInt(configService.get('REDIS_RETRY_DELAY', '100'), 10),
  maxLoadingTimeout: parseInt(configService.get('REDIS_MAX_LOADING_TIMEOUT', '5000'), 10),
});

/**
 * Factory function para crear configuración de transacciones
 */
export const createTransactionConfig = (configService: ConfigService): TransactionConfig => ({
  timeout: parseInt(configService.get('TRANSACTION_TIMEOUT', '5000'), 10),
  maxRetries: parseInt(configService.get('TRANSACTION_MAX_RETRIES', '3'), 10),
  retryDelay: parseInt(configService.get('TRANSACTION_RETRY_DELAY', '100'), 10),
  maxDelay: parseInt(configService.get('TRANSACTION_MAX_DELAY', '1000'), 10),
});

/**
 * Factory function para crear configuración de load testing
 */
export const createLoadTestConfig = (configService: ConfigService): LoadTestConfig => ({
  maxWaitTime: parseInt(configService.get('LOAD_TEST_MAX_WAIT_TIME', '300000'), 10),
  checkInterval: parseInt(configService.get('LOAD_TEST_CHECK_INTERVAL', '2000'), 10),
  pauseMs: parseInt(configService.get('LOAD_TEST_PAUSE_MS', '100'), 10),
  heavyPauseMs: parseInt(configService.get('LOAD_TEST_HEAVY_PAUSE_MS', '50'), 10),
});

/**
 * Factory function para crear configuración de idempotencia
 */
export const createIdempotencyConfig = (configService: ConfigService): IdempotencyConfig => ({
  ttl: parseInt(configService.get('IDEMPOTENCY_TTL', '3600000'), 10),
  processingTtl: parseInt(configService.get('IDEMPOTENCY_PROCESSING_TTL', '900000'), 10),
});

/**
 * Factory function para crear configuración de logging
 */
export const createLoggingConfig = (configService: ConfigService): LoggingConfig => ({
  level: configService.get('LOG_LEVEL', 'info'),
  queueOperations: configService.get('LOG_QUEUE_OPERATIONS', 'false') === 'true',
  workerStats: configService.get('LOG_WORKER_STATS', 'false') === 'true',
  resourceUsage: configService.get('LOG_RESOURCE_USAGE', 'false') === 'true',
});

/**
 * Factory function para crear feature flags
 */
export const createFeatureFlags = (configService: ConfigService): FeatureFlags => ({
  enableQueueSystem: configService.get('ENABLE_QUEUE_SYSTEM', 'true') === 'true',
  enableCache: configService.get('ENABLE_CACHE', 'true') === 'true',
  enableMonitoring: configService.get('ENABLE_MONITORING', 'true') === 'true',
});

/**
 * Configuración unificada del sistema
 */
export interface SystemConfig {
  queue: QueueSystemConfig;
  worker: WorkerConfig;
  monitoring: MonitoringConfig;
  cache: CacheConfig;
  polling: PollingConfig;
  redis: RedisConfig;
  transaction: TransactionConfig;
  loadTest: LoadTestConfig;
  idempotency: IdempotencyConfig;
  logging: LoggingConfig;
  features: FeatureFlags;
}

/**
 * Factory principal para crear toda la configuración del sistema
 */
export const createSystemConfig = (configService: ConfigService): SystemConfig => ({
  queue: createQueueSystemConfig(configService),
  worker: createWorkerConfig(configService),
  monitoring: createMonitoringConfig(configService),
  cache: createCacheConfig(configService),
  polling: createPollingConfig(configService),
  redis: createRedisConfig(configService),
  transaction: createTransactionConfig(configService),
  loadTest: createLoadTestConfig(configService),
  idempotency: createIdempotencyConfig(configService),
  logging: createLoggingConfig(configService),
  features: createFeatureFlags(configService),
});

/**
 * Servicio de configuración para inyección de dependencias
 */
export const SYSTEM_CONFIG = 'SYSTEM_CONFIG';

export const systemConfigProvider = {
  provide: SYSTEM_CONFIG,
  useFactory: createSystemConfig,
  inject: [ConfigService],
};