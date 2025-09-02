/**
 * 🎯 Cache Interface - Single Responsibility Principle
 * 
 * Define el contrato para cualquier implementación de cache,
 * siguiendo el principio de Interface Segregation
 */

export interface ICacheService {
  /**
   * Obtiene un valor del cache
   * @param key - Clave única del cache
   * @returns El valor cacheado o null si no existe/expiró
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Almacena un valor en el cache
   * @param key - Clave única del cache
   * @param value - Valor a almacenar
   * @param ttl - Time to live en milisegundos (opcional)
   */
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Elimina una entrada específica del cache
   * @param key - Clave a eliminar
   */
  delete(key: string): Promise<boolean>;

  /**
   * Limpia todo el cache
   */
  clear(): Promise<void>;

  /**
   * Verifica si una clave existe en el cache
   * @param key - Clave a verificar
   */
  has(key: string): Promise<boolean>;

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): Promise<CacheStats>;

  /**
   * Obtiene información de configuración
   */
  getConfig(): CacheConfig;
}

/**
 * 📊 Cache Statistics - Para monitoreo y métricas
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
  averageResponseTime: number;
  totalOperations: number;
  evictions: number;
  lastCleanup: Date | null;
}

/**
 * ⚙️ Cache Configuration - Para flexibilidad y mantenibilidad
 */
export interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  cleanupInterval: number;
  enableMetrics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 🔍 Cache Entry - Estructura interna para almacenamiento
 */
export interface CacheEntry<T = any> {
  value: T;
  expiry: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number; // Para tracking de memoria
}

/**
 * 🎯 Cache Key Strategy - Para generar claves consistentes
 */
export interface ICacheKeyStrategy {
  /**
   * Genera una clave de cache para requests HTTP
   */
  generateHttpRequestKey(
    method: string,
    url: string,
    queryParams?: Record<string, any>,
    userId?: string,
  ): string;

  /**
   * Valida si un request es cacheable
   */
  isCacheable(method: string, url: string): boolean;

  /**
   * Determina el TTL específico para un endpoint
   */
  getTtlForEndpoint(url: string): number;
}

/**
 * 📈 Cache Metrics Reporter - Para observabilidad
 */
export interface ICacheMetrics {
  recordHit(key: string, responseTime: number): void;
  recordMiss(key: string): void;
  recordEviction(key: string, reason: 'ttl' | 'lru' | 'manual'): void;
  recordSet(key: string, size: number): void;
  getMetrics(): CacheStats;
  reset(): void;
}
