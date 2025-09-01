import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { ICacheKeyStrategy } from '../interfaces/cache.interface';

/**
 * 🔑 HTTP Cache Key Strategy
 * 
 * Implementa la estrategia de generación de claves para cache de requests HTTP
 * Siguiendo el patrón Strategy para permitir diferentes algoritmos de cache
 */
@Injectable()
export class HttpCacheKeyStrategy implements ICacheKeyStrategy {
  private readonly logger = new Logger(HttpCacheKeyStrategy.name);

  /**
   * 🏗️ Genera una clave única para requests HTTP
   * 
   * Formula: hash(method + url + normalizedParams + userId)
   * Esto garantiza que requests idénticos generen la misma clave
   */
  generateHttpRequestKey(
    method: string,
    url: string,
    queryParams?: Record<string, any>,
    userId?: string,
  ): string {
    try {
      // 🧹 Normalize components
      const normalizedMethod = method.toUpperCase();
      const normalizedUrl = this.normalizeUrl(url);
      const normalizedParams = this.normalizeQueryParams(queryParams);
      const userPart = userId ? `:user:${userId}` : '';

      // 🔧 Build cache key components
      const keyString = `${normalizedMethod}:${normalizedUrl}:${normalizedParams}${userPart}`;
      
      // 🔐 Generate hash for consistent, short keys
      const hash = createHash('md5').update(keyString).digest('hex');
      
      // 🏷️ Add prefix for easy identification and cleanup
      const cacheKey = `http:${hash}`;
      
      this.logger.debug(`Generated cache key: ${cacheKey} for ${normalizedMethod} ${normalizedUrl}`);
      
      return cacheKey;
      
    } catch (error) {
      this.logger.error('Error generating cache key:', error);
      // 🔄 Fallback to simple key
      return `http:fallback:${Date.now()}:${Math.random()}`;
    }
  }

  /**
   * ✅ Determina si un request es cacheable
   * 
   * Reglas de cacheabilidad:
   * - Solo GET requests
   * - No endpoints críticos (inscripciones)
   * - No endpoints de monitoreo/debugging
   * - No operaciones con efectos secundarios
   */
  isCacheable(method: string, url: string): boolean {
    // 🚫 Solo GET requests son cacheables
    if (method.toUpperCase() !== 'GET') {
      return false;
    }

    // 🚫 Excluir endpoints críticos y de sistema
    const nonCacheablePatterns = [
      // Operaciones críticas
      '/atomic-enrollment',
      '/auth/login',
      '/auth/logout',
      '/auth/register',
      
      // Monitoreo y debugging
      '/health',
      '/metrics',
      '/monitoring',
      '/queue',
      '/debug',
      '/load-test',
      
      // APIs en tiempo real
      '/jobs/',
      '/stream',
      '/sse',
      '/websocket',
      
      // Endpoints que siempre deben ser fresh
      '/stats',
      '/status',
      '/current',
      '/now',
      '/timestamp',
    ];

    for (const pattern of nonCacheablePatterns) {
      if (url.toLowerCase().includes(pattern.toLowerCase())) {
        this.logger.debug(`URL ${url} marked as non-cacheable (matches pattern: ${pattern})`);
        return false;
      }
    }

    // ✅ Por defecto, los GET requests son cacheables
    return true;
  }

  /**
   * ⏰ Determina el TTL específico para un endpoint
   * 
   * TTL adaptativo basado en la naturaleza del endpoint:
   * - Datos estáticos: TTL largo (15 min)
   * - Datos académicos: TTL medio (5 min) 
   * - Datos variables: TTL corto (1 min)
   */
  getTtlForEndpoint(url: string): number {
    const urlLower = url.toLowerCase();

    // 📚 Datos académicos semi-estáticos (TTL largo: 15 minutos)
    const staticPatterns = [
      '/courses',
      '/programs',
      '/degree-program',
      '/study-plan',
      '/prerequisite',
      '/levels',
      '/classrooms',
      '/facilities',
    ];

    for (const pattern of staticPatterns) {
      if (urlLower.includes(pattern)) {
        return 15 * 60 * 1000; // 15 minutos
      }
    }

    // 👥 Datos de usuarios y dinámicos (TTL medio: 5 minutos)
    const mediumPatterns = [
      '/students',
      '/teachers',
      '/grades',
      '/schedules',
      '/calendar',
      '/terms',
    ];

    for (const pattern of mediumPatterns) {
      if (urlLower.includes(pattern)) {
        return 5 * 60 * 1000; // 5 minutos
      }
    }

    // 🔄 Datos frecuentemente cambiantes (TTL corto: 1 minuto)
    const dynamicPatterns = [
      '/enrollment',
      '/assessments',
      '/recent',
      '/activity',
      '/notifications',
    ];

    for (const pattern of dynamicPatterns) {
      if (urlLower.includes(pattern)) {
        return 1 * 60 * 1000; // 1 minuto
      }
    }

    // 🎯 TTL por defecto: 5 minutos
    return 5 * 60 * 1000;
  }

  // 🔧 Private Helper Methods

  /**
   * 🧹 Normaliza la URL para consistencia en cache keys
   */
  private normalizeUrl(url: string): string {
    try {
      // Remove query params from URL (handled separately)
      const urlObj = new URL(url, 'http://dummy.com');
      let normalizedPath = urlObj.pathname;

      // Normalize trailing slashes
      if (normalizedPath.endsWith('/') && normalizedPath.length > 1) {
        normalizedPath = normalizedPath.slice(0, -1);
      }

      // Convert to lowercase for case-insensitive caching
      return normalizedPath.toLowerCase();
      
    } catch (error) {
      // If URL parsing fails, return as-is but cleaned
      return url.split('?')[0].toLowerCase();
    }
  }

  /**
   * 🎯 Normaliza query parameters para cache keys consistentes
   */
  private normalizeQueryParams(params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    try {
      // 🔤 Sort keys for consistent ordering
      const sortedKeys = Object.keys(params).sort();
      
      // 🏗️ Build normalized param string
      const paramPairs = sortedKeys.map(key => {
        const value = params[key];
        
        // Handle arrays and objects
        if (Array.isArray(value)) {
          return `${key}=[${value.sort().join(',')}]`;
        } else if (typeof value === 'object' && value !== null) {
          return `${key}=${JSON.stringify(value)}`;
        } else {
          return `${key}=${String(value)}`;
        }
      });
      
      return paramPairs.join('&');
      
    } catch (error) {
      this.logger.warn('Error normalizing query params:', error);
      return JSON.stringify(params);
    }
  }
}

/**
 * 🎯 Cache Key Builder - Factory para crear claves especializadas
 * 
 * Permite generar claves de cache para diferentes tipos de operaciones
 */
@Injectable()
export class CacheKeyBuilder {
  constructor(private readonly strategy: HttpCacheKeyStrategy) {}

  /**
   * 🌐 Construye clave para request HTTP completo
   */
  forHttpRequest(
    method: string,
    url: string,
    queryParams?: Record<string, any>,
    userId?: string,
  ): string | null {
    if (!this.strategy.isCacheable(method, url)) {
      return null;
    }

    return this.strategy.generateHttpRequestKey(method, url, queryParams, userId);
  }

  /**
   * 📊 Construye clave para datos paginados
   */
  forPaginatedData(
    baseUrl: string,
    page: number,
    limit: number,
    filters?: Record<string, any>,
  ): string {
    const queryParams = {
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    };

    return this.strategy.generateHttpRequestKey('GET', baseUrl, queryParams);
  }

  /**
   * 👤 Construye clave específica para usuario
   */
  forUserData(userId: string, dataType: string, identifier?: string): string {
    const url = identifier 
      ? `/user-data/${dataType}/${identifier}`
      : `/user-data/${dataType}`;
      
    return this.strategy.generateHttpRequestKey('GET', url, undefined, userId);
  }

  /**
   * ⏰ Obtiene TTL para una URL específica
   */
  getTtlForUrl(url: string): number {
    return this.strategy.getTtlForEndpoint(url);
  }

  /**
   * ✅ Verifica si un endpoint es cacheable
   */
  isCacheable(method: string, url: string): boolean {
    return this.strategy.isCacheable(method, url);
  }
}
