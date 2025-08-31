import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ResourceMonitorService } from './resource-monitor.service';
import { ConnectionPoolService } from './connection-pool.service';
import { WorkerService } from '../workers/worker.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly resourceMonitor: ResourceMonitorService,
    private readonly connectionPool: ConnectionPoolService,
    private readonly workerService: WorkerService,
  ) {}

  /**
   * Obtiene estadísticas completas del sistema de resource management
   */
  @Get('stats')
  getSystemStats() {
    const workerStats = this.workerService.getWorkerStats();
    const memoryStats = this.resourceMonitor.getRecentStats(5);
    const poolStats = this.connectionPool.getRecentStats(5);

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
      memory: this.resourceMonitor.getLimits(),
      connectionPool: this.connectionPool.getConfig(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        workerMaxHeapMB: process.env.WORKER_MAX_HEAP_MB || '256',
        workerMaxRssMB: process.env.WORKER_MAX_RSS_MB || '512',
        dbPoolMax: process.env.WORKER_DB_POOL_MAX || '5',
        gcAvailable: !!global.gc,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Método auxiliar para determinar estado general
  private determineOverallStatus(
    statuses: string[],
  ): 'healthy' | 'warning' | 'critical' {
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }
}
