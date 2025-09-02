import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { 
  ICacheService, 
  CacheStats, 
  CacheConfig, 
  CacheEntry,
  ICacheMetrics 
} from '../interfaces/cache.interface';

/**
 * 🚀 LRU Cache Service - Least Recently Used Implementation
 * 
 * Implementa un cache LRU en memoria siguiendo principios SOLID:
 * - Single Responsibility: Solo maneja caching LRU
 * - Open/Closed: Extensible via interfaces
 * - Liskov Substitution: Implementa ICacheService
 * - Interface Segregation: Interfaces específicas y cohesivas
 * - Dependency Inversion: Depende de abstracciones (ICacheMetrics)
 */
@Injectable()
export class LRUCacheService implements ICacheService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LRUCacheService.name);
  
  // 🗂️ Core LRU Data Structures
  private cache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>(); // Para tracking de LRU
  private currentTime = 0; // Logical clock para LRU ordering
  
  // ⚙️ Configuration
  private readonly config: CacheConfig;
  
  // 📊 Metrics & Monitoring
  private metrics: ICacheMetrics;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(
    config: Partial<CacheConfig> = {},
    metrics?: ICacheMetrics,
  ) {
    // 🎛️ Default Configuration (Open/Closed Principle)
    this.config = {
      maxSize: config.maxSize ?? 1000,
      defaultTtl: config.defaultTtl ?? 5 * 60 * 1000, // 5 minutos
      cleanupInterval: config.cleanupInterval ?? 60 * 1000, // 1 minuto
      enableMetrics: config.enableMetrics ?? true,
      logLevel: config.logLevel ?? 'info',
      ...config,
    };
    
    this.metrics = metrics ?? new DefaultCacheMetrics();
    
    this.logger.log(`🚀 LRU Cache initialized with config: ${JSON.stringify(this.config)}`);
  }

  async onModuleInit(): Promise<void> {
    this.startCleanupTask();
    this.logger.log('✅ LRU Cache service started');
  }

  async onModuleDestroy(): Promise<void> {
    this.stopCleanupTask();
    await this.clear();
    this.logger.log('🛑 LRU Cache service stopped');
  }

  /**
   * 🔍 Get - Implements Cache-aside pattern with LRU tracking
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.recordMiss(key);
        return null;
      }
      
      // ⏰ TTL Check
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.recordMiss(key);
        return null;
      }
      
      // 📊 Update LRU tracking
      this.updateAccessOrder(key, entry);
      
      // 📈 Record cache hit
      const responseTime = Date.now() - startTime;
      this.recordHit(key, responseTime);
      
      this.logDebug(`Cache HIT for key: ${key}`);
      return entry.value as T;
      
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 💾 Set - Implements LRU eviction with size management
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const now = Date.now();
      const effectiveTtl = ttl ?? this.config.defaultTtl;
      
      // 🧮 Calculate entry size (approximation)
      const entrySize = this.calculateSize(value);
      
      // 📦 Create cache entry
      const entry: CacheEntry<T> = {
        value,
        expiry: now + effectiveTtl,
        createdAt: now,
        lastAccessed: now,
        accessCount: 0,
        size: entrySize,
      };
      
      // 🚨 Ensure space availability (LRU eviction)
      await this.ensureCapacity();
      
      // 💾 Store in cache
      this.cache.set(key, entry);
      this.updateAccessOrder(key, entry);
      
      // 📊 Record metrics
      this.metrics.recordSet(key, entrySize);
      
      this.logDebug(`Cache SET for key: ${key}, TTL: ${effectiveTtl}ms`);
      
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 🗑️ Delete - Manual cache invalidation
   */
  async delete(key: string): Promise<boolean> {
    try {
      const existed = this.cache.has(key);
      
      if (existed) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        this.metrics.recordEviction(key, 'manual');
        this.logDebug(`Cache DELETE for key: ${key}`);
      }
      
      return existed;
      
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 🧹 Clear - Remove all entries
   */
  async clear(): Promise<void> {
    try {
      const size = this.cache.size;
      this.cache.clear();
      this.accessOrder.clear();
      this.currentTime = 0;
      
      this.logger.log(`🧹 Cache cleared - removed ${size} entries`);
      
    } catch (error) {
      this.logger.error('Cache CLEAR error:', error);
    }
  }

  /**
   * ❓ Has - Check if key exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (this.isExpired(entry)) {
      await this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 📊 Get Stats - Cache performance metrics
   */
  async getStats(): Promise<CacheStats> {
    const metrics = this.metrics.getMetrics();
    
    return {
      ...metrics,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      memoryUsage: this.calculateTotalMemoryUsage(),
    };
  }

  /**
   * ⚙️ Get Config - Current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  // 🔧 Private Helper Methods

  /**
   * ⏰ Check if entry has expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiry;
  }

  /**
   * 📊 Update LRU access order
   */
  private updateAccessOrder(key: string, entry: CacheEntry): void {
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.accessOrder.set(key, ++this.currentTime);
  }

  /**
   * 🚨 Ensure cache capacity (LRU eviction)
   */
  private async ensureCapacity(): Promise<void> {
    while (this.cache.size >= this.config.maxSize) {
      await this.evictLRU();
    }
  }

  /**
   * 🔄 Evict least recently used entry
   */
  private async evictLRU(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    // 🔍 Find least recently used entry
    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.metrics.recordEviction(oldestKey, 'lru');
      this.logDebug(`LRU eviction: ${oldestKey}`);
    }
  }

  /**
   * 🧹 Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // 🔍 Find expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredKeys.push(key);
      }
    }
    
    // 🗑️ Remove expired entries
    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.metrics.recordEviction(key, 'ttl');
    }
    
    if (expiredKeys.length > 0) {
      this.logDebug(`TTL cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * ⏰ Start periodic cleanup task
   */
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(
      () => this.cleanupExpired(),
      this.config.cleanupInterval,
    );
  }

  /**
   * ⏸️ Stop cleanup task
   */
  private stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 🧮 Calculate approximate size of value
   */
  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Approximate bytes (UTF-16)
    } catch {
      return 1000; // Default size for non-serializable values
    }
  }

  /**
   * 💾 Calculate total memory usage
   */
  private calculateTotalMemoryUsage(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  // 📊 Metrics helpers
  private recordHit(key: string, responseTime: number): void {
    if (this.config.enableMetrics) {
      this.metrics.recordHit(key, responseTime);
    }
  }

  private recordMiss(key: string): void {
    if (this.config.enableMetrics) {
      this.metrics.recordMiss(key);
    }
  }

  // 🐛 Debug logging
  private logDebug(message: string): void {
    if (this.config.logLevel === 'debug') {
      this.logger.debug(message);
    }
  }
}

/**
 * 📊 Default Cache Metrics Implementation
 * 
 * Implementación básica de métricas para el cache
 */
class DefaultCacheMetrics implements ICacheMetrics {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    maxSize: 0,
    memoryUsage: 0,
    averageResponseTime: 0,
    totalOperations: 0,
    evictions: 0,
    lastCleanup: null,
  };
  
  private responseTimes: number[] = [];

  recordHit(key: string, responseTime: number): void {
    this.stats.hits++;
    this.stats.totalOperations++;
    this.responseTimes.push(responseTime);
    this.updateDerivedMetrics();
  }

  recordMiss(key: string): void {
    this.stats.misses++;
    this.stats.totalOperations++;
    this.updateDerivedMetrics();
  }

  recordEviction(key: string, reason: 'ttl' | 'lru' | 'manual'): void {
    this.stats.evictions++;
    if (reason === 'ttl') {
      this.stats.lastCleanup = new Date();
    }
  }

  recordSet(key: string, size: number): void {
    // Metrics updated externally for size and memory
  }

  getMetrics(): CacheStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      maxSize: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      totalOperations: 0,
      evictions: 0,
      lastCleanup: null,
    };
    this.responseTimes = [];
  }

  private updateDerivedMetrics(): void {
    // Calculate hit rate
    if (this.stats.totalOperations > 0) {
      this.stats.hitRate = (this.stats.hits / this.stats.totalOperations) * 100;
    }

    // Calculate average response time
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
      this.stats.averageResponseTime = sum / this.responseTimes.length;
      
      // Keep only last 1000 response times to prevent memory leak
      if (this.responseTimes.length > 1000) {
        this.responseTimes = this.responseTimes.slice(-1000);
      }
    }
  }
}
