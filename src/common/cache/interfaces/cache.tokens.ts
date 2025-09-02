/**
 * 🔗 Cache Injection Tokens
 * 
 * Tokens para inyección de dependencias de los servicios de cache
 */

export const CACHE_SERVICE_TOKEN = Symbol('ICacheService');
export const CACHE_KEY_STRATEGY_TOKEN = Symbol('ICacheKeyStrategy');
export const CACHE_METRICS_TOKEN = Symbol('ICacheMetrics');

// Re-export interfaces
export * from './cache.interface';