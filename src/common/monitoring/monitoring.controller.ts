import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ResourceMonitorService } from './resource-monitor.service';
import { ConnectionPoolService } from './connection-pool.service';
import { DynamicWorkerService } from '../workers/dynamic-worker.service';
import { WebSocketGateway } from '../websockets/websocket.gateway';
import { JobStatusService } from '../websockets/job-status.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly resourceMonitor: ResourceMonitorService,
    private readonly connectionPool: ConnectionPoolService,
    private readonly workerService: DynamicWorkerService,
    private readonly webSocketGateway: WebSocketGateway,
    private readonly jobStatusService: JobStatusService,
  ) {}

  /**
   * Obtiene estadísticas completas del sistema de resource management
   */
  @Get('stats')
  async getSystemStats() {
    const workerStats = await this.workerService.getWorkerStats();
    const memoryStats = this.resourceMonitor.getRecentStats(5);
    const poolStats = this.connectionPool.getRecentStats(5);
    
    // 🚀 Get cache statistics
    const cacheStats = await this.workerService.getCacheStats();

    return {
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        pid: process.pid,
      },
      workers: workerStats,
      memory: {
        current: this.resourceMonitor.getCurrentMemoryUsage(),
        health: this.resourceMonitor.getHealthStatus(),
        limits: this.resourceMonitor.getLimits(),
        usagePercent: this.resourceMonitor.getMemoryUsagePercentage(),
        recentHistory: memoryStats,
      },
      connectionPool: {
        current: this.connectionPool.getCurrentStats(),
        health: this.connectionPool.getHealthStatus(),
        config: this.connectionPool.getConfig(),
        recentHistory: poolStats,
      },
      cache: cacheStats ? {
        stats: cacheStats,
        health: this.determineCacheHealth(cacheStats),
      } : null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtiene el estado de salud del sistema
   */
  @Get('health')
  getSystemHealth() {
    const memoryHealth = this.resourceMonitor.getHealthStatus();
    const poolHealth = this.connectionPool.getHealthStatus();

    // Determinar estado general del sistema
    const overallStatus = this.determineOverallStatus([
      memoryHealth.status,
      poolHealth.status,
    ]);

    return {
      status: overallStatus,
      components: {
        memory: memoryHealth,
        connectionPool: poolHealth,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtiene métricas detalladas de memoria
   */
  @Get('memory')
  getMemoryMetrics() {
    const current = this.resourceMonitor.getCurrentMemoryUsage();
    const limits = this.resourceMonitor.getLimits();
    const recent = this.resourceMonitor.getRecentStats(20);
    const avgUsage = this.resourceMonitor.getAverageMemoryUsage(5);

    return {
      current: {
        heapUsedMB: (current.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (current.heapTotal / 1024 / 1024).toFixed(2),
        rssMB: (current.rss / 1024 / 1024).toFixed(2),
        externalMB: (current.external / 1024 / 1024).toFixed(2),
        arrayBuffersMB: (current.arrayBuffers / 1024 / 1024).toFixed(2),
      },
      limits,
      usage: {
        heapUsagePercent: this.resourceMonitor
          .getMemoryUsagePercentage()
          .toFixed(1),
        averageUsageMB: avgUsage.toFixed(2),
        isOverLimit: this.resourceMonitor.isMemoryOverLimit(),
      },
      history: recent.map((stat) => ({
        timestamp: stat.timestamp,
        heapUsedMB: (stat.memory.heapUsed / 1024 / 1024).toFixed(1),
        uptimeSeconds: stat.uptime,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtiene métricas del connection pool
   */
  @Get('connection-pool')
  getConnectionPoolMetrics() {
    const current = this.connectionPool.getCurrentStats();
    const config = this.connectionPool.getConfig();
    const recent = this.connectionPool.getRecentStats(20);
    const avgActive = this.connectionPool.getAverageActiveConnections(5);

    return {
      current,
      config,
      usage: {
        utilizationPercent: (
          (current.totalConnections / current.maxConnections) *
          100
        ).toFixed(1),
        averageActiveConnections: avgActive.toFixed(1),
      },
      history: recent.map((stat) => ({
        timestamp: stat.timestamp,
        active: stat.activeConnections,
        idle: stat.idleConnections,
        total: stat.totalConnections,
        pending: stat.pendingAcquires,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fuerza garbage collection
   */
  @Post('gc')
  @HttpCode(HttpStatus.OK)
  forceGarbageCollection() {
    const beforeMemory = this.resourceMonitor.getCurrentMemoryUsage();
    const success = this.resourceMonitor.forceGarbageCollection();
    const afterMemory = this.resourceMonitor.getCurrentMemoryUsage();

    if (!success) {
      return {
        success: false,
        message:
          'Garbage collection not available - start with --expose-gc flag',
        timestamp: new Date().toISOString(),
      };
    }

    const freedMB =
      (beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024;

    return {
      success: true,
      message: 'Garbage collection completed',
      memoryFreedMB: freedMB.toFixed(2),
      beforeHeapMB: (beforeMemory.heapUsed / 1024 / 1024).toFixed(2),
      afterHeapMB: (afterMemory.heapUsed / 1024 / 1024).toFixed(2),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ejecuta limpieza completa de recursos
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  async performResourceCleanup() {
    const result = await this.workerService.performResourceCleanup();

    return {
      ...result,
      message: result.success
        ? 'Resource cleanup completed successfully'
        : 'Resource cleanup failed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Testa la conexión a la base de datos
   */
  @Get('connection-test')
  async testDatabaseConnection() {
    const startTime = Date.now();
    const success = await this.connectionPool.testConnection();
    const duration = Date.now() - startTime;

    return {
      success,
      durationMs: duration,
      message: success
        ? 'Database connection test successful'
        : 'Database connection test failed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtiene configuración actual del sistema
   */
  @Get('config')
  getSystemConfig() {
    return {
      environment: process.env.NODE_ENV || 'development',
      features: {
        queueSystemEnabled: process.env.ENABLE_QUEUE_SYSTEM === 'true',
        cacheEnabled: process.env.ENABLE_CACHE === 'true',
        monitoringEnabled: process.env.ENABLE_MONITORING === 'true',
      },
      polling: {
        interval: parseInt(process.env.POLLING_INTERVAL || '2000', 10),
        maxTime: parseInt(process.env.POLLING_MAX_TIME || '120000', 10),
        timeoutRetries: parseInt(process.env.POLLING_TIMEOUT_RETRIES || '3', 10),
      },
      queue: {
        timeouts: {
          critical: parseInt(process.env.QUEUE_CRITICAL_TIMEOUT || '30', 10),
          standard: parseInt(process.env.QUEUE_STANDARD_TIMEOUT || '60', 10),
          background: parseInt(process.env.QUEUE_BACKGROUND_TIMEOUT || '120', 10),
        },
        attempts: {
          critical: parseInt(process.env.QUEUE_CRITICAL_ATTEMPTS || '3', 10),
          standard: parseInt(process.env.QUEUE_STANDARD_ATTEMPTS || '2', 10),
          background: parseInt(process.env.QUEUE_BACKGROUND_ATTEMPTS || '1', 10),
        },
      },
      worker: {
        maxHeapMB: parseInt(process.env.WORKER_MAX_HEAP_MB || '256', 10),
        maxRssMB: parseInt(process.env.WORKER_MAX_RSS_MB || '512', 10),
        maxCpuPercent: parseInt(process.env.WORKER_MAX_CPU_PERCENT || '80', 10),
        gcInterval: parseInt(process.env.WORKER_GC_INTERVAL || '30000', 10),
      },
      cache: {
        maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '1000', 10),
        ttlMinutes: parseInt(process.env.CACHE_TTL_MINUTES || '5', 10),
        enabled: process.env.CACHE_ENABLED === 'true',
      },
      monitoring: {
        resourceInterval: parseInt(process.env.MONITORING_RESOURCE_INTERVAL || '5000', 10),
        connectionPoolInterval: parseInt(process.env.MONITORING_CONNECTION_POOL_INTERVAL || '10000', 10),
        healthCheckInterval: parseInt(process.env.MONITORING_HEALTH_CHECK_INTERVAL || '30000', 10),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🚀 Get detailed cache statistics
   */
  @Get('cache')
  async getCacheStats() {
    const cacheStats = await this.workerService.getCacheStats();
    
    if (!cacheStats) {
      return {
        status: 'error',
        message: 'Cache statistics not available',
        timestamp: new Date().toISOString(),
      };
    }

    const health = this.determineCacheHealth(cacheStats);

    return {
      status: 'success',
      cache: {
        ...cacheStats,
        health,
        performance: {
          hitRatePercentage: cacheStats.hitRate,
          memoryUsageMB: (cacheStats.memoryUsage / 1024 / 1024).toFixed(2),
          utilizationPercentage: ((cacheStats.size / cacheStats.maxSize) * 100).toFixed(1),
          averageResponseTimeMs: cacheStats.averageResponseTime.toFixed(2),
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🧹 Clear cache manually
   */
  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    try {
      await this.workerService.clearCache();
      
      return {
        status: 'success',
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to clear cache: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Método auxiliar para determinar estado general
  private determineOverallStatus(
    statuses: string[],
  ): 'healthy' | 'warning' | 'critical' {
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  /**
   * 🚀 Determine cache health based on stats
   */
  private determineCacheHealth(stats: any): { status: 'healthy' | 'warning' | 'critical'; issues: string[] } {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (!stats) {
      return { status: 'critical', issues: ['Cache stats not available'] };
    }

    // Check hit rate
    if (stats.hitRate < 30) {
      issues.push(`Low hit rate: ${stats.hitRate.toFixed(1)}%`);
      status = 'warning';
    }

    // Check cache size vs max size
    if (stats.size >= stats.maxSize * 0.9) {
      issues.push(`High cache usage: ${stats.size}/${stats.maxSize} entries`);
      status = (status === 'warning' || status === 'healthy') ? 'warning' : status;
    }

    // Check memory usage (if over 100MB for cache)
    if (stats.memoryUsage > 100 * 1024 * 1024) {
      issues.push(`High memory usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
      status = (status === 'warning' || status === 'healthy') ? 'warning' : status;
    }

    // Check if too many evictions recently
    if (stats.evictions > stats.totalOperations * 0.1) {
      issues.push(`High eviction rate: ${stats.evictions} evictions`);
      status = (status === 'warning' || status === 'healthy') ? 'warning' : status;
    }

    return { status, issues };
  }

  /**
   * Obtiene estadísticas de conexiones WebSocket
   */
  @Get('websocket/stats')
  async getWebSocketStats() {
    const gatewayStats = this.webSocketGateway.getGatewayStats();
    const jobStats = this.jobStatusService.getJobStatistics();

    return {
      websocket: gatewayStats,
      jobs: jobStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtiene la configuración de polling para clientes
   */
  @Get('config')
  async getClientConfig() {
    return {
      polling: {
        interval: parseInt(process.env.POLLING_INTERVAL || '2000', 10),
        maxTime: parseInt(process.env.POLLING_MAX_TIME || '120000', 10),
      },
      websocket: {
        enabled: true,
        namespace: '/jobs',
        fallbackToPolling: true,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
