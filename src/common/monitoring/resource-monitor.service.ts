import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { EventEmitter } from 'events';

export interface MemoryUsage {
  rss: number; // Resident Set Size - memoria física total usada
  heapTotal: number; // Memoria total del heap de V8
  heapUsed: number; // Memoria usada del heap de V8
  external: number; // Memoria usada por objetos C++ vinculados a JavaScript
  arrayBuffers: number; // Memoria usada por ArrayBuffers
}

export interface ResourceStats {
  memory: MemoryUsage;
  uptime: number;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: number;
  workerId?: string;
}

export interface ResourceLimits {
  maxHeapMB: number; // Límite de heap en MB (256MB según spec)
  maxRssMB: number; // Límite de RSS en MB
  maxCpuPercent: number; // Límite de CPU en porcentaje
}

@Injectable()
export class ResourceMonitorService
  extends EventEmitter
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ResourceMonitorService.name);

  // Configuración según Fase 5.1
  private readonly limits: ResourceLimits = {
    maxHeapMB: parseInt(process.env.WORKER_MAX_HEAP_MB || '256', 10),
    maxRssMB: parseInt(process.env.WORKER_MAX_RSS_MB || '512', 10),
    maxCpuPercent: parseInt(process.env.WORKER_MAX_CPU_PERCENT || '80', 10),
  };

  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastCpuUsage: NodeJS.CpuUsage = process.cpuUsage();
  private stats: ResourceStats[] = [];
  private readonly maxStatsHistory = 100; // Mantener 100 mediciones

  // Estados de alerta
  private isMemoryWarning = false;
  private isMemoryCritical = false;
  private consecutiveWarnings = 0;

  async onModuleInit() {
    this.startMonitoring();
    this.logger.log(
      `🔍 Resource monitoring started - Limits: Heap=${this.limits.maxHeapMB}MB, RSS=${this.limits.maxRssMB}MB`,
    );
  }

  async onModuleDestroy() {
    this.stopMonitoring();
    this.logger.log('🛑 Resource monitoring stopped');
  }

  private startMonitoring() {
    // Monitorear cada 5 segundos según especificación
    this.monitoringInterval = setInterval(() => {
      this.checkResources();
    }, 5000);
  }

  private stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private checkResources() {
    const currentStats = this.getCurrentStats();
    this.addStats(currentStats);

    // Verificar límites de memoria
    this.checkMemoryLimits(currentStats);

    // Emitir evento con estadísticas actuales
    this.emit('stats', currentStats);
  }

  private getCurrentStats(): ResourceStats {
    const memoryUsage = process.memoryUsage();
    const currentCpuUsage = process.cpuUsage();

    return {
      memory: memoryUsage,
      uptime: process.uptime(),
      cpuUsage: currentCpuUsage,
      timestamp: Date.now(),
      workerId: process.env.WORKER_ID || 'main',
    };
  }

  private addStats(stats: ResourceStats) {
    this.stats.push(stats);

    // Mantener solo las últimas mediciones
    if (this.stats.length > this.maxStatsHistory) {
      this.stats = this.stats.slice(-this.maxStatsHistory);
    }
  }

  private checkMemoryLimits(stats: ResourceStats) {
    const heapUsedMB = stats.memory.heapUsed / 1024 / 1024;
    const rssUsedMB = stats.memory.rss / 1024 / 1024;

    // Niveles de alerta
    const warningThreshold = this.limits.maxHeapMB * 0.8; // 80% = warning
    const criticalThreshold = this.limits.maxHeapMB * 0.95; // 95% = critical

    if (heapUsedMB > criticalThreshold) {
      if (!this.isMemoryCritical) {
        this.isMemoryCritical = true;
        this.logger.error(
          `🚨 CRITICAL: Memory usage ${heapUsedMB.toFixed(1)}MB exceeds ${criticalThreshold.toFixed(1)}MB threshold`,
        );
        this.emit('memory-critical', {
          heapUsedMB,
          limit: this.limits.maxHeapMB,
          stats,
        });
      }
      this.consecutiveWarnings++;
    } else if (heapUsedMB > warningThreshold) {
      if (!this.isMemoryWarning) {
        this.isMemoryWarning = true;
        this.logger.warn(
          `⚠️  WARNING: Memory usage ${heapUsedMB.toFixed(1)}MB exceeds ${warningThreshold.toFixed(1)}MB threshold`,
        );
        this.emit('memory-warning', {
          heapUsedMB,
          limit: this.limits.maxHeapMB,
          stats,
        });
      }
      this.consecutiveWarnings++;
    } else {
      // Reset de estados de alerta
      if (this.isMemoryWarning || this.isMemoryCritical) {
        this.logger.log(
          `✅ Memory usage normalized: ${heapUsedMB.toFixed(1)}MB`,
        );
        this.isMemoryWarning = false;
        this.isMemoryCritical = false;
        this.consecutiveWarnings = 0;
        this.emit('memory-normal', { heapUsedMB, stats });
      }
    }

    // Si memoria crítica por más de 3 mediciones consecutivas (15 segundos)
    if (this.consecutiveWarnings >= 3 && this.isMemoryCritical) {
      this.logger.error(
        `💥 CRITICAL: Memory critical for ${this.consecutiveWarnings * 5} seconds - requesting restart`,
      );
      this.emit('memory-restart-required', {
        heapUsedMB,
        consecutiveWarnings: this.consecutiveWarnings,
        stats,
      });
    }
  }

  // API pública
  getCurrentMemoryUsage(): MemoryUsage {
    return process.memoryUsage();
  }

  isMemoryOverLimit(): boolean {
    const heapUsedMB = process.memoryUsage().heapUsed / 1024 / 1024;
    return heapUsedMB > this.limits.maxHeapMB;
  }

  getMemoryUsagePercentage(): number {
    const heapUsedMB = process.memoryUsage().heapUsed / 1024 / 1024;
    return (heapUsedMB / this.limits.maxHeapMB) * 100;
  }

  forceGarbageCollection(): boolean {
    try {
      if (global.gc) {
        const beforeMemory = process.memoryUsage().heapUsed;
        global.gc();
        const afterMemory = process.memoryUsage().heapUsed;
        const freedMB = (beforeMemory - afterMemory) / 1024 / 1024;

        this.logger.log(`🗑️  Forced GC freed ${freedMB.toFixed(1)}MB`);
        this.emit('gc-completed', { freedMB, beforeMemory, afterMemory });
        return true;
      } else {
        this.logger.warn(
          '⚠️  Garbage collection not available - start with --expose-gc flag',
        );
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Error during forced GC: ${error.message}`);
      return false;
    }
  }

  getRecentStats(count: number = 10): ResourceStats[] {
    return this.stats.slice(-count);
  }

  getAverageMemoryUsage(minutes: number = 5): number {
    const cutoffTime = Date.now() - minutes * 60 * 1000;
    const recentStats = this.stats.filter(
      (stat) => stat.timestamp > cutoffTime,
    );

    if (recentStats.length === 0) return 0;

    const totalHeapUsed = recentStats.reduce(
      (sum, stat) => sum + stat.memory.heapUsed,
      0,
    );
    return totalHeapUsed / recentStats.length / 1024 / 1024; // MB
  }

  getLimits(): ResourceLimits {
    return { ...this.limits };
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    details: any;
  } {
    const current = this.getCurrentStats();
    const heapUsedMB = current.memory.heapUsed / 1024 / 1024;
    const usage = this.getMemoryUsagePercentage();

    if (this.isMemoryCritical) {
      return {
        status: 'critical',
        details: {
          heapUsedMB: heapUsedMB.toFixed(1),
          usagePercent: usage.toFixed(1),
          limit: this.limits.maxHeapMB,
          consecutiveWarnings: this.consecutiveWarnings,
        },
      };
    }

    if (this.isMemoryWarning) {
      return {
        status: 'warning',
        details: {
          heapUsedMB: heapUsedMB.toFixed(1),
          usagePercent: usage.toFixed(1),
          limit: this.limits.maxHeapMB,
        },
      };
    }

    return {
      status: 'healthy',
      details: {
        heapUsedMB: heapUsedMB.toFixed(1),
        usagePercent: usage.toFixed(1),
        limit: this.limits.maxHeapMB,
      },
    };
  }
}
