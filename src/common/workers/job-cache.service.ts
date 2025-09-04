import { Injectable, Logger, Inject } from '@nestjs/common';
import { JobData } from '../interceptors/interfaces/job-data.interface';
import { ICacheService } from '../cache/interfaces/cache.interface';
import { CACHE_SERVICE_TOKEN } from '../cache/interfaces/cache.tokens';
import { CacheKeyBuilder } from '../cache/strategies/http-cache-key.strategy';

@Injectable()
export class JobCacheService {
  private readonly logger = new Logger(JobCacheService.name);

  constructor(
    @Inject(CACHE_SERVICE_TOKEN)
    private readonly cacheService: ICacheService,
    private readonly cacheKeyBuilder: CacheKeyBuilder,
  ) {}

  async tryGetFromCache(jobData: JobData): Promise<any | null> {
    try {
      const cacheKey = this.buildCacheKey(jobData);
      if (!cacheKey) return null;

      const cachedResult = await this.cacheService.get(cacheKey);
      
      if (cachedResult) {
        this.logger.debug(`🎯 Cache HIT for ${jobData.method} ${jobData.url}`);
        return { 
          ...cachedResult, 
          _cache: { 
            hit: true, 
            key: cacheKey, 
            timestamp: new Date().toISOString() 
          } 
        };
      }

      this.logger.debug(`❌ Cache MISS for ${jobData.method} ${jobData.url}`);
      return null;
    } catch (error) {
      this.logger.warn(`Cache read error: ${error.message}`);
      return null;
    }
  }

  async tryStoreInCache(jobData: JobData, result: any): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(jobData);
      if (!cacheKey) return;

      const ttl = this.cacheKeyBuilder.getTtlForUrl(jobData.url);
      const cacheableResult = this.prepareCacheableResult(result);
      
      await this.cacheService.set(cacheKey, cacheableResult, ttl);

      this.logger.debug(`💾 Cached result for ${jobData.method} ${jobData.url} (TTL: ${ttl}ms)`);
    } catch (error) {
      this.logger.warn(`Cache write error: ${error.message}`);
    }
  }

  private buildCacheKey(jobData: JobData): string | null {
    return this.cacheKeyBuilder.forHttpRequest(
      jobData.method,
      jobData.url,
      this.extractQueryParams(jobData.url),
      jobData.userId,
    );
  }

  private extractQueryParams(url: string): Record<string, any> | undefined {
    try {
      const urlObj = new URL(url, 'http://dummy.com');
      const params: Record<string, any> = {};
      
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      return Object.keys(params).length > 0 ? params : undefined;
    } catch {
      return undefined;
    }
  }

  private prepareCacheableResult(result: any): any {
    try {
      const cacheable = JSON.parse(JSON.stringify(result));
      
      // Remove sensitive information
      if (cacheable.token) delete cacheable.token;
      if (cacheable.password) delete cacheable.password;
      if (cacheable.jwt) delete cacheable.jwt;

      // Add cache metadata
      cacheable._cache = {
        cached: true,
        cachedAt: new Date().toISOString(),
        version: '1.0',
      };

      return cacheable;
    } catch {
      return result;
    }
  }

  async getStats() {
    try {
      return await this.cacheService.getStats();
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cacheService.clear();
      this.logger.log('🧹 Cache cleared manually');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }
}