import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../queues/queue.service';
import { RedisService } from '../redis/redis.service';

export interface LoadTestConfig {
  totalJobs: number;
  concurrency: number;
  duration?: number; // en segundos
  queueType: 'critical' | 'standard' | 'background' | 'mixed';
  endpoints?: string[];
}

export interface LoadTestMetrics {
  testId: string;
  config: LoadTestConfig;
  startTime: number;
  endTime?: number;
  totalJobsCreated: number;
  totalJobsCompleted: number;
  totalJobsFailed: number;
  jobsPerSecond: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  percentile95: number;
  percentile99: number;
  errors: string[];
  memoryUsage: NodeJS.MemoryUsage | null;
  redisStats: Record<string, unknown> | null;
}

export interface JobResult {
  jobId: string;
  startTime: number;
  endTime: number;
  latency: number;
  success: boolean;
  error?: string;
}

@Injectable()
export class LoadTestService {
  private readonly logger = new Logger(LoadTestService.name);
  private activeTests = new Map<string, LoadTestMetrics>();
  private jobResults = new Map<string, JobResult[]>();

  constructor(
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Ejecuta un test de carga con la configuración especificada
   */
  runLoadTest(config: LoadTestConfig): string {
    const testId = this.generateTestId();

    this.logger.log(
      `🚀 Starting load test ${testId} with ${config.totalJobs} jobs, concurrency: ${config.concurrency}`,
    );

    const metrics: LoadTestMetrics = {
      testId,
      config,
      startTime: Date.now(),
      totalJobsCreated: 0,
      totalJobsCompleted: 0,
      totalJobsFailed: 0,
      jobsPerSecond: 0,
      averageLatency: 0,
      minLatency: 0,
      maxLatency: 0,
      percentile95: 0,
      percentile99: 0,
      errors: [],
      memoryUsage: null,
      redisStats: null,
    };

    this.activeTests.set(testId, metrics);
    this.jobResults.set(testId, []);

    // Ejecutar test en background
    void this.executeLoadTest(testId, config).catch((error) => {
      this.logger.error(`❌ Load test ${testId} failed:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      metrics.errors.push(errorMessage);
    });

    return testId;
  }

  /**
   * Ejecuta el test de carga real
   */
  private async executeLoadTest(
    testId: string,
    config: LoadTestConfig,
  ): Promise<void> {
    const metrics = this.activeTests.get(testId)!;
    const results: JobResult[] = [];

    try {
      // Crear jobs con concurrencia limitada
      const jobBatches = this.createJobBatches(config);

      for (const batch of jobBatches) {
        const batchPromises = batch.map((jobData) =>
          this.createAndTrackJob(testId, jobData),
        );

        // Ejecutar batch con concurrencia limitada
        const batchResults = await Promise.allSettled(batchPromises);

        // Procesar resultados del batch
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            metrics.totalJobsCreated++;
          } else {
            const reason =
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason);
            metrics.errors.push(`Job ${index} failed: ${reason}`);
          }
        });

        // Pausa adaptativa según el tamaño del test
        const pauseMs = config.totalJobs > 10000 ? 50 : 100;
        await this.sleep(pauseMs);
      }

      // Esperar a que todos los jobs completen
      await this.waitForJobsCompletion(testId, config.totalJobs);

      // Calcular métricas finales
      await this.calculateFinalMetrics(testId);
    } catch (error) {
      this.logger.error(`💥 Load test execution failed:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      metrics.errors.push(errorMessage);
    } finally {
      metrics.endTime = Date.now();
      this.logger.log(`✅ Load test ${testId} completed`);
    }
  }

  /**
   * Crea y trackea un job individual
   */
  private async createAndTrackJob(
    testId: string,
    jobData: {
      method: string;
      url: string;
      body?: Record<string, unknown>;
      queueType: 'critical' | 'standard' | 'background';
    },
  ): Promise<JobResult> {
    const startTime = Date.now();
    const jobId = this.generateJobId();

    try {
      // Crear job según el tipo de cola
      switch (jobData.queueType) {
        case 'critical':
          await this.queueService.addCriticalJob({
            id: jobId,
            method: jobData.method,
            url: jobData.url,
            data: jobData.body,
            headers: {
              'content-type': 'application/json',
              'user-agent': 'load-test-client/1.0',
            },
            timestamp: startTime,
          });
          break;
        case 'standard':
          await this.queueService.addStandardJob({
            id: jobId,
            method: jobData.method,
            url: jobData.url,
            data: jobData.body,
            headers: {
              'content-type': 'application/json',
              'user-agent': 'load-test-client/1.0',
            },
            timestamp: startTime,
          });
          break;
        case 'background':
          await this.queueService.addBackgroundJob({
            id: jobId,
            method: jobData.method,
            url: jobData.url,
            data: jobData.body,
            headers: {
              'content-type': 'application/json',
              'user-agent': 'load-test-client/1.0',
            },
            timestamp: startTime,
          });
          break;
        default:
          throw new Error(`Unknown queue type: ${jobData.queueType}`);
      }

      // Iniciar tracking del job
      void this.trackJobCompletion(testId, jobId, startTime);

      return {
        jobId,
        startTime,
        endTime: 0, // Se actualizará cuando complete
        latency: 0,
        success: true,
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        jobId,
        startTime,
        endTime,
        latency: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Trackea la finalización de un job específico
   */
  private trackJobCompletion(
    testId: string,
    jobId: string,
    startTime: number,
  ): void {
    const maxWaitTime = 300000; // 5 minutos máximo
    const pollInterval = 500; // 500ms
    const maxPolls = maxWaitTime / pollInterval;

    let polls = 0;

    const pollJob = async (): Promise<void> => {
      try {
        const jobStatus = await this.queueService.getJobStatus(jobId);

        if (!jobStatus) {
          // Job no encontrado, considerarlo como fallido después de algunos intentos
          if (polls > 10) {
            this.recordJobResult(testId, {
              jobId,
              startTime,
              endTime: Date.now(),
              latency: Date.now() - startTime,
              success: false,
              error: 'Job not found',
            });
            return;
          }
        } else if (jobStatus.status === 'completed') {
          // Job completado exitosamente
          this.recordJobResult(testId, {
            jobId,
            startTime,
            endTime: Date.now(),
            latency: Date.now() - startTime,
            success: true,
          });
          return;
        } else if (jobStatus.status === 'failed') {
          // Job falló
          this.recordJobResult(testId, {
            jobId,
            startTime,
            endTime: Date.now(),
            latency: Date.now() - startTime,
            success: false,
            error: jobStatus.error || 'Job failed',
          });
          return;
        }

        // Si no completó, continuar polling
        polls++;
        if (polls < maxPolls) {
          setTimeout(() => void pollJob(), pollInterval);
        } else {
          // Timeout
          this.recordJobResult(testId, {
            jobId,
            startTime,
            endTime: Date.now(),
            latency: Date.now() - startTime,
            success: false,
            error: 'Polling timeout',
          });
        }
      } catch (error) {
        this.recordJobResult(testId, {
          jobId,
          startTime,
          endTime: Date.now(),
          latency: Date.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // Iniciar polling
    setTimeout(() => void pollJob(), pollInterval);
  }

  /**
   * Registra el resultado de un job
   */
  private recordJobResult(testId: string, result: JobResult): void {
    const results = this.jobResults.get(testId);
    if (results) {
      results.push(result);
    }

    const metrics = this.activeTests.get(testId);
    if (metrics) {
      if (result.success) {
        metrics.totalJobsCompleted++;
      } else {
        metrics.totalJobsFailed++;
        if (result.error) {
          metrics.errors.push(result.error);
        }
      }
    }
  }

  /**
   * Crea batches de jobs para controlar la concurrencia
   */
  private createJobBatches(config: LoadTestConfig): Array<
    Array<{
      method: string;
      url: string;
      body?: Record<string, unknown>;
      queueType: 'critical' | 'standard' | 'background';
    }>
  > {
    const jobs: Array<{
      method: string;
      url: string;
      body?: Record<string, unknown>;
      queueType: 'critical' | 'standard' | 'background';
    }> = [];
    const endpoints = config.endpoints || this.getDefaultEndpoints();

    for (let i = 0; i < config.totalJobs; i++) {
      const endpoint = endpoints[i % endpoints.length] || '/test';
      const queueType =
        config.queueType === 'mixed'
          ? this.getRandomQueueType()
          : config.queueType;

      jobs.push({
        method: this.getMethodForEndpoint(endpoint),
        url: endpoint,
        body: this.getBodyForEndpoint(endpoint),
        queueType,
      });
    }

    // Dividir en batches según concurrencia
    const batches: Array<Array<{
      method: string;
      url: string;
      body?: Record<string, unknown>;
      queueType: 'critical' | 'standard' | 'background';
    }>> = [];
    for (let i = 0; i < jobs.length; i += config.concurrency) {
      batches.push(jobs.slice(i, i + config.concurrency));
    }

    return batches;
  }

  /**
   * Espera a que todos los jobs del test completen
   */
  private async waitForJobsCompletion(
    testId: string,
    expectedJobs: number,
  ): Promise<void> {
    const maxWaitTime = 600000; // 10 minutos máximo
    const checkInterval = 2000; // 2 segundos
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const metrics = this.activeTests.get(testId);
      if (metrics) {
        const completedJobs =
          metrics.totalJobsCompleted + metrics.totalJobsFailed;

        this.logger.log(
          `📊 Test ${testId}: ${completedJobs}/${expectedJobs} jobs completed`,
        );

        if (completedJobs >= expectedJobs) {
          this.logger.log(`✅ All jobs completed for test ${testId}`);
          break;
        }
      }

      await this.sleep(checkInterval);
    }
  }

  /**
   * Calcula las métricas finales del test
   */
  private async calculateFinalMetrics(testId: string): Promise<void> {
    const metrics = this.activeTests.get(testId);
    const results = this.jobResults.get(testId);

    if (!metrics || !results) return;

    const successfulResults = results.filter((r) => r.success);
    const latencies = successfulResults.map((r) => r.latency);

    if (latencies.length > 0) {
      latencies.sort((a, b) => a - b);

      metrics.averageLatency =
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      metrics.minLatency = latencies[0];
      metrics.maxLatency = latencies[latencies.length - 1];
      metrics.percentile95 = latencies[Math.floor(latencies.length * 0.95)];
      metrics.percentile99 = latencies[Math.floor(latencies.length * 0.99)];
    }

    const totalTime = (metrics.endTime! - metrics.startTime) / 1000;
    metrics.jobsPerSecond = metrics.totalJobsCompleted / totalTime;

    // Obtener métricas de sistema
    try {
      metrics.memoryUsage = process.memoryUsage();
      metrics.redisStats = await this.getRedisStats();
    } catch (error) {
      this.logger.error('Error getting system metrics:', error);
    }

    this.logger.log(`📈 Final metrics for test ${testId}:`, {
      totalJobs: metrics.totalJobsCreated,
      completed: metrics.totalJobsCompleted,
      failed: metrics.totalJobsFailed,
      jobsPerSecond: metrics.jobsPerSecond.toFixed(2),
      avgLatency: `${metrics.averageLatency.toFixed(2)}ms`,
      p95: `${metrics.percentile95}ms`,
      p99: `${metrics.percentile99}ms`,
    });
  }

  /**
   * Obtiene estadísticas de Redis
   */
  private async getRedisStats(): Promise<Record<string, unknown>> {
    try {
      const info = await this.redisService.getInfo();
      const lines = info.split('\n');

      const stats: Record<string, unknown> = {};
      lines.forEach((line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (
            key &&
            value !== undefined &&
            (key.includes('memory') ||
              key.includes('connected') ||
              key.includes('ops'))
          ) {
            stats[key.trim()] = value.trim();
          }
        }
      });

      return stats;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage };
    }
  }

  /**
   * Obtiene las métricas de un test específico
   */
  getTestMetrics(testId: string): LoadTestMetrics | null {
    return this.activeTests.get(testId) || null;
  }

  /**
   * Obtiene todos los tests activos
   */
  getActiveTests(): LoadTestMetrics[] {
    return Array.from(this.activeTests.values());
  }

  /**
   * Limpia los datos de un test completado
   */
  cleanupTest(testId: string): void {
    this.activeTests.delete(testId);
    this.jobResults.delete(testId);
  }

  // Métodos utilitarios
  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateJobId(): string {
    return `loadtest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private getDefaultEndpoints(): string[] {
    return [
      '/courses',
      '/students',
      '/auth/login',
      '/reports/generate',
      '/notifications/send',
      '/grades',
      '/academic-validations/check',
    ];
  }

  private getRandomQueueType(): 'critical' | 'standard' | 'background' {
    const types = ['critical', 'standard', 'background'] as const;
    return types[Math.floor(Math.random() * types.length)] || 'standard';
  }

  private getMethodForEndpoint(endpoint: string): string {
    if (
      endpoint.includes('/auth/login') ||
      endpoint.includes('/reports') ||
      endpoint.includes('/notifications')
    ) {
      return 'POST';
    }
    return 'GET';
  }

  private getBodyForEndpoint(
    endpoint: string,
  ): Record<string, unknown> | undefined {
    if (endpoint.includes('/auth/login')) {
      return { email: 'loadtest@test.com', password: 'password123' };
    }
    if (endpoint.includes('/reports')) {
      return { type: 'enrollment_summary', format: 'pdf' };
    }
    if (endpoint.includes('/notifications')) {
      return {
        message: 'Load test notification',
        recipients: ['test@test.com'],
      };
    }
    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
