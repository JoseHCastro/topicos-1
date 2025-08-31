import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

export interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  acquiredConnections: number;
  pendingAcquires: number;
  timestamp: number;
}

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
}

@Injectable()
export class ConnectionPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);

  // Configuración según Fase 5.1 - máximo 5 conexiones para workers
  private readonly config: ConnectionPoolConfig = {
    maxConnections: parseInt(process.env.WORKER_DB_POOL_MAX || '5', 10),
    minConnections: parseInt(process.env.WORKER_DB_POOL_MIN || '1', 10),
    acquireTimeoutMs: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '10000', 10), // 10s según spec
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30s idle cleanup
    connectionTimeoutMs: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || '10000',
      10,
    ), // 10s según spec
  };

  private monitoringInterval: NodeJS.Timeout | null = null;
  private stats: ConnectionPoolStats[] = [];
  private readonly maxStatsHistory = 50;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Configurar el pool de conexiones optimizado para workers
    await this.optimizeConnectionPool();
    this.startMonitoring();
    this.logger.log(
      `🔗 Connection pool optimized - Max: ${this.config.maxConnections} connections`,
    );
  }

  async onModuleDestroy() {
    this.stopMonitoring();
    await this.cleanupIdleConnections();
    this.logger.log('🔗 Connection pool monitoring stopped');
  }

  private async optimizeConnectionPool() {
    // Configurar pool según especificaciones de Fase 5.1
    const pool = this.dataSource.driver.master;

    if (pool && typeof pool.config === 'object') {
      // Aplicar configuración optimizada para workers
      Object.assign(pool.config, {
        max: this.config.maxConnections,
        min: this.config.minConnections,
        acquireTimeoutMillis: this.config.acquireTimeoutMs,
        idleTimeoutMillis: this.config.idleTimeoutMs,
        connectionTimeoutMillis: this.config.connectionTimeoutMs,

        // Configuraciones adicionales para estabilidad
        createTimeoutMillis: 5000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 10000, // Cleanup cada 10s
        createRetryIntervalMillis: 200,

        // Validación de conexiones
        testOnBorrow: true,
        testOnReturn: false,
        testOnCreate: false,
        testWhileIdle: true,

        // Logs para debugging en desarrollo
        log:
          process.env.NODE_ENV === 'development'
            ? this.logger.debug.bind(this.logger)
            : undefined,
      });

      this.logger.log('📊 Connection pool configuration applied');
    }
  }

  private startMonitoring() {
    // Monitorear pool cada 10 segundos
    this.monitoringInterval = setInterval(() => {
      this.collectPoolStats();
    }, 10000);
  }

  private stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private collectPoolStats() {
    try {
      const stats = this.getCurrentPoolStats();
      this.addStats(stats);
      this.checkPoolHealth(stats);
    } catch (error) {
      this.logger.error(`❌ Error collecting pool stats: ${error.message}`);
    }
  }

  private getCurrentPoolStats(): ConnectionPoolStats {
    const pool = this.dataSource.driver.master;

    // Estadísticas del pool (puede variar según el driver)
    const stats: ConnectionPoolStats = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: this.config.maxConnections,
      acquiredConnections: 0,
      pendingAcquires: 0,
      timestamp: Date.now(),
    };

    try {
      if (pool && typeof pool.numUsed === 'function') {
        // Para node-postgres
        stats.acquiredConnections = pool.numUsed();
        stats.idleConnections = pool.numFree();
        stats.totalConnections = pool.numUsed() + pool.numFree();
        stats.pendingAcquires = pool.numPendingAcquires();
        stats.activeConnections = stats.acquiredConnections;
      } else if (pool && pool._allObjects) {
        // Fallback genérico
        stats.totalConnections = pool._allObjects.length || 0;
        stats.activeConnections =
          (pool._allObjects.length || 0) - (pool._availableObjects.length || 0);
        stats.idleConnections = pool._availableObjects.length || 0;
        stats.acquiredConnections = stats.activeConnections;
      }
    } catch (error) {
      this.logger.debug(`Unable to get detailed pool stats: ${error.message}`);
    }

    return stats;
  }

  private addStats(stats: ConnectionPoolStats) {
    this.stats.push(stats);

    if (this.stats.length > this.maxStatsHistory) {
      this.stats = this.stats.slice(-this.maxStatsHistory);
    }
  }

  private checkPoolHealth(stats: ConnectionPoolStats) {
    // Verificar si el pool está saturado
    if (stats.totalConnections >= this.config.maxConnections * 0.9) {
      this.logger.warn(
        `⚠️  Connection pool near limit: ${stats.totalConnections}/${this.config.maxConnections}`,
      );
    }

    // Verificar conexiones pendientes
    if (stats.pendingAcquires > 0) {
      this.logger.warn(
        `⚠️  ${stats.pendingAcquires} connections waiting in queue`,
      );
    }

    // Log periódico en desarrollo
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `🔗 Pool: ${stats.activeConnections} active, ${stats.idleConnections} idle, ${stats.totalConnections} total`,
      );
    }
  }

  // API pública
  async testConnection(): Promise<boolean> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.query('SELECT 1 as test');
      await queryRunner.release();
      return true;
    } catch (error) {
      this.logger.error(`❌ Connection test failed: ${error.message}`);
      return false;
    }
  }

  async getConnectionWithTimeout<T>(
    operation: (queryRunner: any) => Promise<T>,
    timeoutMs: number = this.config.acquireTimeoutMs,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Configurar timeout para la operación
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Connection acquire timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const operationPromise = (async () => {
        await queryRunner.connect();
        return await operation(queryRunner);
      })();

      const result = await Promise.race([operationPromise, timeoutPromise]);
      return result;
    } finally {
      await queryRunner.release();
    }
  }

  async cleanupIdleConnections(): Promise<void> {
    try {
      const pool = this.dataSource.driver.master;

      if (pool && typeof pool.clear === 'function') {
        await pool.clear();
        this.logger.log('🧹 Idle connections cleaned up');
      }
    } catch (error) {
      this.logger.error(`❌ Error cleaning up connections: ${error.message}`);
    }
  }

  getCurrentStats(): ConnectionPoolStats {
    return this.getCurrentPoolStats();
  }

  getRecentStats(count: number = 10): ConnectionPoolStats[] {
    return this.stats.slice(-count);
  }

  getAverageActiveConnections(minutes: number = 5): number {
    const cutoffTime = Date.now() - minutes * 60 * 1000;
    const recentStats = this.stats.filter(
      (stat) => stat.timestamp > cutoffTime,
    );

    if (recentStats.length === 0) return 0;

    const totalActive = recentStats.reduce(
      (sum, stat) => sum + stat.activeConnections,
      0,
    );
    return totalActive / recentStats.length;
  }

  getConfig(): ConnectionPoolConfig {
    return { ...this.config };
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    details: any;
  } {
    const stats = this.getCurrentStats();
    const utilizationPercent =
      (stats.totalConnections / stats.maxConnections) * 100;

    if (utilizationPercent >= 95 || stats.pendingAcquires > 2) {
      return {
        status: 'critical',
        details: {
          utilization: `${utilizationPercent.toFixed(1)}%`,
          connections: `${stats.totalConnections}/${stats.maxConnections}`,
          pending: stats.pendingAcquires,
          message: 'Connection pool near saturation',
        },
      };
    }

    if (utilizationPercent >= 80 || stats.pendingAcquires > 0) {
      return {
        status: 'warning',
        details: {
          utilization: `${utilizationPercent.toFixed(1)}%`,
          connections: `${stats.totalConnections}/${stats.maxConnections}`,
          pending: stats.pendingAcquires,
          message: 'Connection pool usage high',
        },
      };
    }

    return {
      status: 'healthy',
      details: {
        utilization: `${utilizationPercent.toFixed(1)}%`,
        connections: `${stats.totalConnections}/${stats.maxConnections}`,
        active: stats.activeConnections,
        idle: stats.idleConnections,
      },
    };
  }
}
