import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { DynamicWorkerService } from '../workers/dynamic-worker.service';
import { QueueDefinition } from '../queues/queue-config.interface';

@Controller('admin/queues')
export class QueueAdminController {
  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly workerService: DynamicWorkerService,
  ) {}

  /**
   * Get all queue configurations and statistics
   */
  @Get()
  async getAllQueues() {
    const stats = await this.queueService.getQueuesStats();
    const config = this.queueService.getQueueConfig();
    const workerStats = this.workerService.getWorkerStats();

    return {
      message: 'Queue system overview',
      config: {
        enabled: config.enabled,
        defaultQueue: config.defaultQueue,
        totalQueues: stats.totalQueues,
      },
      queues: stats.queues,
      workers: workerStats.workers,
      performance: {
        jobsProcessed: workerStats.jobs.total,
        memoryUsage: workerStats.memory,
        uptime: workerStats.uptime,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get specific queue information
   */
  @Get(':queueName')
  async getQueueInfo(@Param('queueName') queueName: string) {
    const queueDef = this.queueService.getQueueDefinition(queueName);
    
    if (!queueDef) {
      return {
        error: `Queue '${queueName}' not found`,
        availableQueues: this.queueService.getAvailableQueues(),
        timestamp: new Date().toISOString(),
      };
    }

    const stats = await this.queueService.getQueuesStats();
    
    return {
      message: `Queue '${queueName}' information`,
      queue: queueDef,
      statistics: stats.queues[queueName],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test queue by adding a sample job
   */
  @Post(':queueName/test')
  async testQueue(@Param('queueName') queueName: string, @Body() testData?: any) {
    if (!this.queueService.isQueueAvailable(queueName)) {
      return {
        error: `Queue '${queueName}' is not available`,
        availableQueues: this.queueService.getAvailableQueues(),
        timestamp: new Date().toISOString(),
      };
    }

    const jobId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const testJobData = {
      id: jobId,
      method: 'GET',
      url: `/test/${queueName}`,
      data: testData || { test: true, queueName },
      headers: {},
      timestamp: Date.now(),
    };

    try {
      const job = await this.queueService.addJobToQueue(queueName, testJobData);
      
      return {
        message: `Test job added to queue '${queueName}'`,
        jobId: job.id,
        queueName,
        checkStatusUrl: `/queues/job/${job.id}/status`,
        testData: testJobData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: `Failed to add test job to queue '${queueName}': ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get queue configuration
   */
  @Get('config/current')
  getCurrentConfig() {
    const config = this.queueService.getQueueConfig();
    
    return {
      message: 'Current queue system configuration',
      config,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reload configuration from file/environment
   */
  @Post('config/reload')
  async reloadConfiguration() {
    try {
      await this.queueService.reloadConfiguration();
      await this.workerService.reloadWorkers();
      
      const newConfig = this.queueService.getQueueConfig();
      
      return {
        message: 'Configuration reloaded successfully',
        newConfig: {
          totalQueues: newConfig.queues.length,
          enabledQueues: newConfig.queues.filter(q => q.enabled).length,
          defaultQueue: newConfig.defaultQueue,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: `Failed to reload configuration: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get worker statistics
   */
  @Get('workers/stats')
  getWorkerStats() {
    const stats = this.workerService.getWorkerStats();
    
    return {
      message: 'Worker statistics',
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Add new worker for specific queue
   */
  @Post('workers/:queueName')
  async addWorker(@Param('queueName') queueName: string) {
    if (!this.queueService.isQueueAvailable(queueName)) {
      return {
        error: `Queue '${queueName}' is not available`,
        availableQueues: this.queueService.getAvailableQueues(),
        timestamp: new Date().toISOString(),
      };
    }

    try {
      await this.workerService.addWorkerForQueue(queueName);
      
      return {
        message: `Worker added for queue '${queueName}'`,
        queueName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: `Failed to add worker for queue '${queueName}': ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Remove worker for specific queue
   */
  @Delete('workers/:queueName')
  async removeWorker(@Param('queueName') queueName: string) {
    try {
      await this.workerService.removeWorkerForQueue(queueName);
      
      return {
        message: `Worker removed for queue '${queueName}'`,
        queueName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: `Failed to remove worker for queue '${queueName}': ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get URL pattern routing information
   */
  @Get('routing/patterns')
  getRoutingPatterns() {
    const config = this.queueService.getQueueConfig();
    
    const patterns = config.queues.map(queue => ({
      queueName: queue.name,
      displayName: queue.displayName,
      priority: queue.priority,
      enabled: queue.enabled,
      urlPatterns: queue.urlPatterns,
    }));

    return {
      message: 'URL routing patterns for all queues',
      defaultQueue: config.defaultQueue,
      patterns,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test URL routing
   */
  @Post('routing/test')
  testUrlRouting(@Body() body: { url: string }) {
    if (!body.url) {
      return {
        error: 'URL is required',
        example: { url: '/courses/123' },
        timestamp: new Date().toISOString(),
      };
    }

    const queueName = this.queueService.determineQueueForUrl(body.url);
    const queueDef = this.queueService.getQueueDefinition(queueName);

    return {
      message: `URL routing test for '${body.url}'`,
      url: body.url,
      determinedQueue: queueName,
      queueInfo: queueDef ? {
        displayName: queueDef.displayName,
        priority: queueDef.priority,
        timeout: queueDef.timeout,
        estimatedTime: queueDef.estimatedTime,
      } : null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for queue system
   */
  @Get('health/check')
  async healthCheck() {
    const stats = await this.queueService.getQueuesStats();
    const workerStats = this.workerService.getWorkerStats();
    const availableQueues = this.queueService.getAvailableQueues();

    const health = {
      status: 'healthy',
      queues: {
        total: stats.totalQueues,
        available: availableQueues.length,
        enabled: Object.values(stats.queues).filter((q: any) => q.enabled).length,
      },
      workers: {
        total: workerStats.workers.total,
        active: workerStats.workers.active,
      },
      memory: {
        status: workerStats.memory.status,
        usagePercent: parseFloat(workerStats.memory.usagePercent || '0'),
      },
    };

    // Determine overall health
    if (health.queues.available === 0 || health.workers.total === 0) {
      health.status = 'unhealthy';
    } else if (health.memory.usagePercent > 80) {
      health.status = 'degraded';
    }

    return {
      message: 'Queue system health check',
      ...health,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== WORKER CONTROL ENDPOINTS FOR TESTING ==========

  /**
   * Pause all workers - Jobs will queue but not process
   */
  @Post('workers/pause-all')
  async pauseAllWorkers() {
    const result = await this.workerService.pauseAllWorkers();
    
    return {
      message: result.success 
        ? 'All workers paused successfully - jobs will queue but not process'
        : 'Failed to pause workers',
      ...result,
      testing: {
        note: 'Use this to test queue accumulation without processing',
        nextStep: 'Send requests to see jobs queue up',
        resume: 'POST /admin/queues/workers/resume-all',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Resume all workers - Process all queued jobs
   */
  @Post('workers/resume-all')
  async resumeAllWorkers() {
    const result = await this.workerService.resumeAllWorkers();
    
    return {
      message: result.success 
        ? 'All workers resumed successfully - processing queued jobs'
        : 'Failed to resume workers',
      ...result,
      testing: {
        note: 'Workers will now process all accumulated jobs',
        monitor: 'GET /admin/queues/workers/status',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Pause workers for specific queue
   */
  @Post('workers/:queueName/pause')
  async pauseWorkersByQueue(@Param('queueName') queueName: string) {
    const result = await this.workerService.pauseWorkersByQueue(queueName);
    
    return {
      message: result.success 
        ? `Workers for queue '${queueName}' paused successfully`
        : `Failed to pause workers for queue '${queueName}'`,
      ...result,
      testing: {
        note: `Jobs for '${queueName}' will queue but not process`,
        resume: `POST /admin/queues/workers/${queueName}/resume`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Resume workers for specific queue
   */
  @Post('workers/:queueName/resume')
  async resumeWorkersByQueue(@Param('queueName') queueName: string) {
    const result = await this.workerService.resumeWorkersByQueue(queueName);
    
    return {
      message: result.success 
        ? `Workers for queue '${queueName}' resumed successfully`
        : `Failed to resume workers for queue '${queueName}'`,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed workers status (active/paused)
   */
  @Get('workers/status')
  getDetailedWorkerStatus() {
    const status = this.workerService.getWorkersStatus();
    const workerStats = this.workerService.getWorkerStats();
    
    return {
      message: 'Detailed worker status',
      status: status.global,
      workers: {
        global: status.global,
        byQueue: status.byQueue,
        details: workerStats.workers.details,
      },
      testing: {
        controls: {
          pauseAll: 'POST /admin/queues/workers/pause-all',
          resumeAll: 'POST /admin/queues/workers/resume-all',
          pauseQueue: 'POST /admin/queues/workers/{queueName}/pause',
          resumeQueue: 'POST /admin/queues/workers/{queueName}/resume',
        },
        note: 'Use pause/resume to control job processing for testing',
      },
      timestamp: new Date().toISOString(),
    };
  }
}