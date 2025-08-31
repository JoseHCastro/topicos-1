import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { LoadTestService, LoadTestConfig } from './load-test.service';

@Controller('load-test')
export class LoadTestController {
  constructor(private readonly loadTestService: LoadTestService) {}

  /**
   * Inicia un test de carga rápido predefinido
   */
  @Post('quick/:type')
  async runQuickTest(@Param('type') type: 'light' | 'medium' | 'heavy') {
    let config: LoadTestConfig;

    switch (type) {
      case 'light':
        config = {
          totalJobs: 50,
          concurrency: 5,
          queueType: 'mixed',
        };
        break;
      case 'medium':
        config = {
          totalJobs: 200,
          concurrency: 10,
          queueType: 'mixed',
        };
        break;
      case 'heavy':
        config = {
          totalJobs: 500,
          concurrency: 20,
          queueType: 'mixed',
        };
        break;
      default:
        throw new Error('Invalid test type. Use: light, medium, or heavy');
    }

    const testId = this.loadTestService.runLoadTest(config);

    return {
      testId,
      config,
      message: `${type} load test started`,
      checkStatusUrl: `/load-test/${testId}/status`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Inicia un test de carga personalizado
   */
  @Post('custom')
  async runCustomTest(@Body() config: LoadTestConfig) {
    // Validaciones básicas - CONFIGURADO PARA DEMO MASIVA
    if (!config.totalJobs || config.totalJobs < 1 || config.totalJobs > 100000) {
      throw new Error('totalJobs must be between 1 and 100000');
    }

    if (
      !config.concurrency ||
      config.concurrency < 1 ||
      config.concurrency > 1000
    ) {
      throw new Error('concurrency must be between 1 and 1000');
    }

    if (
      !['critical', 'standard', 'background', 'mixed'].includes(
        config.queueType,
      )
    ) {
      throw new Error(
        'queueType must be: critical, standard, background, or mixed',
      );
    }

    const testId = this.loadTestService.runLoadTest(config);

    return {
      testId,
      config,
      message: 'Custom load test started',
      checkStatusUrl: `/load-test/${testId}/status`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test de stress específico para cada cola
   */
  @Post('stress/:queueType')
  async runStressTest(
    @Param('queueType') queueType: 'critical' | 'standard' | 'background',
    @Query('jobs') totalJobs: string = '1000',
    @Query('concurrency') concurrency: string = '25',
  ) {
    const config: LoadTestConfig = {
      totalJobs: parseInt(totalJobs, 10),
      concurrency: parseInt(concurrency, 10),
      queueType,
      endpoints: this.getEndpointsForQueueType(queueType),
    };

    const testId = this.loadTestService.runLoadTest(config);

    return {
      testId,
      config,
      message: `Stress test for ${queueType} queue started`,
      checkStatusUrl: `/load-test/${testId}/status`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🔥 DEMO DE 100K REQUESTS CONCURRENTES
   */
  @Post('demo-100k')
  async runDemo100K(
    @Query('concurrency') concurrency: string = '500',
    @Query('queueType') queueType: 'critical' | 'standard' | 'background' | 'mixed' = 'mixed',
  ) {
    const testConfig: LoadTestConfig = {
      totalJobs: 100000,
      concurrency: parseInt(concurrency, 10),
      queueType,
      endpoints: [
        '/auth/check-status',
        '/courses',
        '/students', 
        '/atomic-enrollment/enroll',
        '/grades',
      ],
    };

    const testId = this.loadTestService.runLoadTest(testConfig);

    return {
      testId,
      config: testConfig,
      message: '🚀 DEMO: 100,000 requests concurrentes iniciado',
      description: 'Prueba de carga masiva para demostración',
      estimatedDuration: '5-10 minutos',
      targets: {
        throughput: '> 1000 jobs/second',
        successRate: '> 95%',
        memoryUsage: '< 1GB',
      },
      monitoringUrls: {
        status: `/load-test/${testId}/status`,
        metrics: `/monitoring/stats`,
        queueStats: `/queues/stats`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test de baseline performance según Fase 5
   */
  @Post('baseline')
  async runBaselineTest() {
    const tests: Array<{ type: string; testId: string; target: string }> = [];

    // Test para Critical Queue (< 5 segundos)
    const criticalTestId = this.loadTestService.runLoadTest({
      totalJobs: 20,
      concurrency: 5,
      queueType: 'critical',
      endpoints: ['/auth/login', '/atomic-enrollment/enroll'],
    });
    tests.push({
      type: 'critical',
      testId: criticalTestId,
      target: '< 5 seconds',
    });

    // Esperar un poco entre tests
    await this.sleep(2000);

    // Test para Standard Queue (< 15 segundos)
    const standardTestId = this.loadTestService.runLoadTest({
      totalJobs: 30,
      concurrency: 10,
      queueType: 'standard',
      endpoints: ['/courses', '/students', '/grades'],
    });
    tests.push({
      type: 'standard',
      testId: standardTestId,
      target: '< 15 seconds',
    });

    // Esperar un poco entre tests
    await this.sleep(2000);

    // Test para Background Queue (< 60 segundos)
    const backgroundTestId = this.loadTestService.runLoadTest({
      totalJobs: 15,
      concurrency: 3,
      queueType: 'background',
      endpoints: ['/reports/generate', '/notifications/send'],
    });
    tests.push({
      type: 'background',
      testId: backgroundTestId,
      target: '< 60 seconds',
    });

    return {
      message: 'Baseline performance tests started',
      tests,
      description:
        'Testing performance baselines according to Phase 5 specifications',
      targets: {
        critical: '< 5 seconds',
        standard: '< 15 seconds',
        background: '< 60 seconds',
        throughput: '> 50 jobs/minute',
      },
      checkAllUrl: '/load-test/active',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Consulta el estado de un test específico
   */
  @Get(':testId/status')
  getTestStatus(@Param('testId') testId: string) {
    const metrics = this.loadTestService.getTestMetrics(testId);

    if (!metrics) {
      return {
        error: 'Test not found',
        testId,
        timestamp: new Date().toISOString(),
      };
    }

    const isRunning = !metrics.endTime;
    const duration = metrics.endTime
      ? metrics.endTime - metrics.startTime
      : Date.now() - metrics.startTime;

    return {
      testId: metrics.testId,
      status: isRunning ? 'running' : 'completed',
      config: metrics.config,
      progress: {
        created: metrics.totalJobsCreated,
        completed: metrics.totalJobsCompleted,
        failed: metrics.totalJobsFailed,
        total: metrics.config.totalJobs,
        percentage: Math.round(
          ((metrics.totalJobsCompleted + metrics.totalJobsFailed) /
            metrics.config.totalJobs) *
            100,
        ),
      },
      performance: {
        duration: `${Math.round(duration / 1000)}s`,
        jobsPerSecond: metrics.jobsPerSecond.toFixed(2),
        averageLatency: `${metrics.averageLatency.toFixed(2)}ms`,
        p95Latency: `${metrics.percentile95}ms`,
        p99Latency: `${metrics.percentile99}ms`,
      },
      system: {
        memoryUsage: metrics.memoryUsage,
        redisStats: metrics.redisStats,
      },
      errors: metrics.errors.slice(-10), // Últimos 10 errores
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Lista todos los tests activos
   */
  @Get('active')
  getActiveTests() {
    const activeTests = this.loadTestService.getActiveTests();

    return {
      totalActiveTests: activeTests.length,
      tests: activeTests.map((test) => ({
        testId: test.testId,
        status: test.endTime ? 'completed' : 'running',
        config: test.config,
        progress: {
          completed: test.totalJobsCompleted,
          failed: test.totalJobsFailed,
          total: test.config.totalJobs,
        },
        performance: {
          jobsPerSecond: test.jobsPerSecond.toFixed(2),
          averageLatency: `${test.averageLatency.toFixed(2)}ms`,
        },
        startTime: new Date(test.startTime).toISOString(),
        duration: test.endTime
          ? `${Math.round((test.endTime - test.startTime) / 1000)}s`
          : `${Math.round((Date.now() - test.startTime) / 1000)}s (running)`,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Limpia un test completado
   */
  @Post(':testId/cleanup')
  cleanupTest(@Param('testId') testId: string) {
    this.loadTestService.cleanupTest(testId);

    return {
      message: `Test ${testId} cleaned up`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtiene recomendaciones para mejorar performance
   */
  @Get(':testId/recommendations')
  getRecommendations(@Param('testId') testId: string) {
    const metrics = this.loadTestService.getTestMetrics(testId);

    if (!metrics || !metrics.endTime) {
      return {
        error: 'Test not found or still running',
        testId,
      };
    }

    const recommendations: Array<{
      type: string;
      priority: string;
      issue: string;
      message: string;
      suggestions: string[];
    }> = [];

    // Analizar jobs/second
    if (metrics.jobsPerSecond < 10) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        issue: 'Low throughput',
        message: `Only ${metrics.jobsPerSecond.toFixed(1)} jobs/second. Target: >50 jobs/minute (0.83 jobs/second)`,
        suggestions: [
          'Increase worker concurrency',
          'Optimize job processing logic',
          'Check database connection pool settings',
          'Consider adding more workers',
        ],
      });
    }

    // Analizar latencias
    if (
      metrics.averageLatency > 5000 &&
      metrics.config.queueType === 'critical'
    ) {
      recommendations.push({
        type: 'latency',
        priority: 'critical',
        issue: 'Critical queue latency too high',
        message: `Average latency: ${metrics.averageLatency.toFixed(2)}ms. Target: <5000ms`,
        suggestions: [
          'Optimize critical queue processing',
          'Add dedicated critical workers',
          'Review job complexity',
          'Check Redis performance',
        ],
      });
    }

    if (
      metrics.averageLatency > 15000 &&
      metrics.config.queueType === 'standard'
    ) {
      recommendations.push({
        type: 'latency',
        priority: 'high',
        issue: 'Standard queue latency too high',
        message: `Average latency: ${metrics.averageLatency.toFixed(2)}ms. Target: <15000ms`,
        suggestions: [
          'Optimize standard queue processing',
          'Consider queue prioritization',
          'Review job batching strategies',
        ],
      });
    }

    // Analizar tasa de errores
    const errorRate =
      (metrics.totalJobsFailed / metrics.totalJobsCreated) * 100;
    if (errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        issue: 'High error rate',
        message: `${errorRate.toFixed(1)}% of jobs failed. Target: <5%`,
        suggestions: [
          'Review error logs',
          'Implement better retry mechanisms',
          'Check system resource limits',
          'Improve error handling',
        ],
      });
    }

    // Analizar memoria
    if (
      metrics.memoryUsage &&
      typeof metrics.memoryUsage === 'object' &&
      'heapUsed' in metrics.memoryUsage &&
      metrics.memoryUsage.heapUsed > 512 * 1024 * 1024
    ) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        issue: 'High memory usage',
        message: `Heap usage: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB. Consider: <512MB`,
        suggestions: [
          'Implement memory limits per worker',
          'Add garbage collection optimization',
          'Review job data size',
          'Consider job result cleanup',
        ],
      });
    }

    // Si no hay problemas
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        priority: 'info',
        issue: 'Performance looks good!',
        message: 'All metrics are within acceptable ranges',
        suggestions: [
          'Consider testing with higher load',
          'Monitor performance in production',
          'Set up performance baselines',
        ],
      });
    }

    return {
      testId,
      recommendations,
      summary: {
        performance:
          metrics.jobsPerSecond >= 0.83 ? 'good' : 'needs_improvement',
        latency: this.getLatencyStatus(metrics),
        reliability: errorRate <= 5 ? 'good' : 'needs_improvement',
        memory: 'acceptable',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Métodos utilitarios privados
  private getEndpointsForQueueType(queueType: string): string[] {
    switch (queueType) {
      case 'critical':
        return ['/auth/login', '/auth/logout', '/atomic-enrollment/enroll'];
      case 'standard':
        return [
          '/courses',
          '/students',
          '/grades',
          '/academic-validations/check',
        ];
      case 'background':
        return ['/reports/generate', '/notifications/send'];
      default:
        return ['/courses', '/students'];
    }
  }

  private getLatencyStatus(metrics: {
    averageLatency: number;
    config: { queueType: string };
  }): string {
    const avgLatency = metrics.averageLatency;
    const queueType = metrics.config.queueType;

    if (queueType === 'critical' && avgLatency < 5000) return 'excellent';
    if (queueType === 'standard' && avgLatency < 15000) return 'good';
    if (queueType === 'background' && avgLatency < 60000) return 'acceptable';

    return 'needs_improvement';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
