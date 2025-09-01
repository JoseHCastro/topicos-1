import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LRUCacheService } from './services/lru-cache.service';
import { HttpCacheKeyStrategy, CacheKeyBuilder } from './strategies/http-cache-key.strategy';
import { ICacheService, CacheConfig } from './interfaces/cache.interface';

/**
 * 🏗️ Cache Module - Dependency Injection Configuration
 * 
 * Módulo global que proporciona servicios de cache siguiendo
 * los principios de Dependency Inversion y configuración flexible
 */
@Global()
@Module({})
export class CacheModule {
  /**
   * 🔧 Configuración estática con valores por defecto
   */
  static forRoot(): DynamicModule {
    return {
      module: CacheModule,
      imports: [ConfigModule],
      providers: [
        // 📊 Cache Service principal
        {
          provide: ICacheService,
          useFactory: (configService: ConfigService) => {
            const config = CacheModule.createCacheConfig(configService);
            return new LRUCacheService(config);
          },
          inject: [ConfigService],
        },
        
        // 🔑 Strategy services
        HttpCacheKeyStrategy,
        CacheKeyBuilder,
        
        // 🎯 Convenience alias
        {
          provide: 'CACHE_SERVICE',
          useExisting: ICacheService,
        },
      ],
      exports: [
        ICacheService,
        'CACHE_SERVICE',
        HttpCacheKeyStrategy,
        CacheKeyBuilder,
      ],
    };
  }

  /**
   * ⚙️ Configuración personalizada asíncrona
   */
  static forRootAsync(options: {
    useFactory?: (...args: any[]) => Promise<CacheConfig> | CacheConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: CacheModule,
      imports: [ConfigModule],
      providers: [
        // 📊 Cache Service con configuración personalizada
        {
          provide: ICacheService,
          useFactory: async (...args: any[]) => {
            const config = options.useFactory 
              ? await options.useFactory(...args)
              : CacheModule.createDefaultConfig();
            
            return new LRUCacheService(config);
          },
          inject: options.inject || [],
        },
        
        // 🔑 Strategy services
        HttpCacheKeyStrategy,
        CacheKeyBuilder,
        
        // 🎯 Convenience alias
        {
          provide: 'CACHE_SERVICE',
          useExisting: ICacheService,
        },
      ],
      exports: [
        ICacheService,
        'CACHE_SERVICE',
        HttpCacheKeyStrategy,
        CacheKeyBuilder,
      ],
    };
  }

  /**
   * 🧪 Configuración para testing con cache en memoria temporal
   */
  static forTesting(overrides: Partial<CacheConfig> = {}): DynamicModule {
    const testConfig: CacheConfig = {
      maxSize: 100, // Smaller for tests
      defaultTtl: 1000, // 1 second for fast tests
      cleanupInterval: 500, // Frequent cleanup
      enableMetrics: true,
      logLevel: 'debug',
      ...overrides,
    };

    return {
      module: CacheModule,
      providers: [
        {
          provide: ICacheService,
          useValue: new LRUCacheService(testConfig),
        },
        HttpCacheKeyStrategy,
        CacheKeyBuilder,
        {
          provide: 'CACHE_SERVICE',
          useExisting: ICacheService,
        },
      ],
      exports: [
        ICacheService,
        'CACHE_SERVICE', 
        HttpCacheKeyStrategy,
        CacheKeyBuilder,
      ],
    };
  }

  // 🔧 Private Configuration Helpers

  /**
   * 🎛️ Crea configuración desde variables de entorno
   */
  private static createCacheConfig(configService: ConfigService): CacheConfig {
    return {
      maxSize: configService.get<number>('CACHE_MAX_SIZE', 1000),
      defaultTtl: configService.get<number>('CACHE_DEFAULT_TTL', 5 * 60 * 1000), // 5 min
      cleanupInterval: configService.get<number>('CACHE_CLEANUP_INTERVAL', 60 * 1000), // 1 min
      enableMetrics: configService.get<boolean>('CACHE_ENABLE_METRICS', true),
      logLevel: configService.get<'debug' | 'info' | 'warn' | 'error'>('CACHE_LOG_LEVEL', 'info'),
    };
  }

  /**
   * 🎯 Configuración por defecto
   */
  private static createDefaultConfig(): CacheConfig {
    return {
      maxSize: 1000,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableMetrics: true,
      logLevel: 'info',
    };
  }
}

/**
 * 🎯 Cache Configuration Factory
 * 
 * Factory function para crear configuraciones especializadas
 */
export class CacheConfigFactory {
  /**
   * 🏃‍♂️ Configuración optimizada para alta performance
   */
  static forHighPerformance(): CacheConfig {
    return {
      maxSize: 5000,
      defaultTtl: 10 * 60 * 1000, // 10 minutes
      cleanupInterval: 2 * 60 * 1000, // 2 minutes
      enableMetrics: true,
      logLevel: 'warn', // Less verbose
    };
  }

  /**
   * 💾 Configuración para uso intensivo de memoria
   */
  static forLowMemory(): CacheConfig {
    return {
      maxSize: 250,
      defaultTtl: 2 * 60 * 1000, // 2 minutes
      cleanupInterval: 30 * 1000, // 30 seconds
      enableMetrics: false, // Save memory
      logLevel: 'error',
    };
  }

  /**
   * 🐛 Configuración para debugging y desarrollo
   */
  static forDevelopment(): CacheConfig {
    return {
      maxSize: 100,
      defaultTtl: 30 * 1000, // 30 seconds
      cleanupInterval: 10 * 1000, // 10 seconds
      enableMetrics: true,
      logLevel: 'debug',
    };
  }

  /**
   * 🚀 Configuración optimizada para demo de 100K requests
   */
  static forDemo100K(): CacheConfig {
    return {
      maxSize: 10000, // Más entries para mejor hit rate
      defaultTtl: 15 * 60 * 1000, // 15 minutes - TTL largo para demo
      cleanupInterval: 5 * 60 * 1000, // 5 minutes - menos interrupciones
      enableMetrics: true,
      logLevel: 'info',
    };
  }
}

/**
 * 📊 Cache Health Check Service
 * 
 * Servicio para monitorear la salud del cache
 */
export class CacheHealthService {
  constructor(private readonly cacheService: ICacheService) {}

  /**
   * 🩺 Health check básico
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    stats: any;
    issues: string[];
  }> {
    try {
      const stats = await this.cacheService.getStats();
      const issues: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      // 🚨 Check hit rate
      if (stats.hitRate < 30) {
        issues.push(`Low hit rate: ${stats.hitRate.toFixed(1)}%`);
        status = 'warning';
      }

      // 🚨 Check memory usage
      if (stats.size >= stats.maxSize * 0.9) {
        issues.push(`High memory usage: ${stats.size}/${stats.maxSize}`);
        status = 'warning';
      }

      // 🚨 Check if cache is working
      const testKey = `health:${Date.now()}`;
      await this.cacheService.set(testKey, 'test', 1000);
      const testValue = await this.cacheService.get(testKey);
      
      if (testValue !== 'test') {
        issues.push('Cache read/write test failed');
        status = 'critical';
      }
      
      await this.cacheService.delete(testKey);

      return { status, stats, issues };
      
    } catch (error) {
      return {
        status: 'critical',
        stats: null,
        issues: [`Cache health check failed: ${error.message}`],
      };
    }
  }
}
