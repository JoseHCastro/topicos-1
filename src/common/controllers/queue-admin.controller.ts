import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { Inject } from '@nestjs/common';
import { IQueueConfigRepository, QUEUE_CONFIG_REPOSITORY } from '../queues/queue-config.repository';
import { DynamicWorkerService } from '../workers/dynamic-worker.service';
import { QueueDefinition } from '../queues/queue-config.interface';

@Controller('admin/queues')
export class QueueAdminController {
  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly workerService: DynamicWorkerService,
    @Inject(QUEUE_CONFIG_REPOSITORY)
    private readonly configRepo: IQueueConfigRepository,
  ) {}

  // ========== WORKER CONTROL ENDPOINTS (MOST SPECIFIC FIRST) ==========

  /**
   * Get worker statistics
   */
  @Get('workers/stats')
  async getWorkerStats() {
    const stats = await this.workerService.getWorkerStats();

    return {
      message: 'Worker statistics',
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get workers status
   */
  @Get('workers/status')
  async getWorkersStatus() {
    const status = await this.workerService.getWorkersStatus();

    return {
      message: 'Workers status',
      ...status,
      timestamp: new Date().toISOString(),
    };
  }

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
   * Create worker for specific queue
   */
  @Post('workers/:queueName')
  async createWorkersForQueue(@Param('queueName') queueName: string) {
    await this.workerService.addWorkerForQueue(queueName);
    // Persist workers count to config based on current status
    try {
      const status = await this.workerService.getWorkersStatus();
      const total = status.byQueue?.[queueName]?.total ?? undefined;
      if (typeof total === 'number') {
        await this.queueService.setQueueWorkers(queueName, total);
      }
    } catch {}

    return {
      message: `Worker added for queue '${queueName}'`,
      queueName,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Delete worker for specific queue
   */
  @Delete('workers/:queueName')
  async deleteWorkersForQueue(@Param('queueName') queueName: string) {
    await this.workerService.removeWorkerForQueue(queueName);
    // Persist workers count to config based on current status
    try {
      const status = await this.workerService.getWorkersStatus();
      const total = status.byQueue?.[queueName]?.total ?? undefined;
      if (typeof total === 'number') {
        await this.queueService.setQueueWorkers(queueName, total);
      }
    } catch {}

    return {
      message: `Worker removed from queue '${queueName}'`,
      queueName,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== QUEUE MANAGEMENT ==========

  /** Create a new queue dynamically */
  @Post()
  async createQueue(@Body() queueDef: QueueDefinition) {
    const queue = await this.queueService.createQueue(queueDef);
    // Persist full config to repository as source of truth
    try {
      await this.configRepo.saveConfig(this.queueService.getQueueConfig());
      await this.configRepo.publishUpdate({ type: 'queue-created', queueName: queueDef.name, timestamp: new Date().toISOString() });
    } catch {}
    // Ensure configured workers are created immediately
    try {
      await this.workerService.ensureWorkersForQueue(queueDef.name);
    } catch (err) {
      // Return queue created, but warn about worker creation
      return {
        message: `Queue '${queueDef.name}' created (workers ensure failed)`,
        queue,
        workerError: err.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      message: `Queue '${queueDef.name}' created`,
      queue,
      timestamp: new Date().toISOString(),
    };
  }

  /** Update existing queue */
  @Put(':queueName')
  async updateQueue(
    @Param('queueName') queueName: string,
    @Body() updates: Partial<QueueDefinition>,
  ) {
    const prev = this.queueService.getQueueDefinition(queueName);
    const prevConcurrency = prev?.concurrency;

    const queue = await this.queueService.updateQueue(queueName, updates);
    // Reconcile workers with new definition and apply new concurrency if changed
    try {
      if (
        typeof updates.concurrency === 'number' &&
        prevConcurrency !== undefined &&
        updates.concurrency !== prevConcurrency
      ) {
        await this.workerService.removeAllWorkersForQueue(queueName);
      }
      await this.workerService.ensureWorkersForQueue(queueName);

      // Persist current workers count in config for coherence
      const status = await this.workerService.getWorkersStatus();
      const total = status.byQueue?.[queueName]?.total ?? undefined;
      if (typeof total === 'number') {
        await this.queueService.setQueueWorkers(queueName, total);
      }
      // Persist config to repository
      await this.configRepo.saveConfig(this.queueService.getQueueConfig());
      await this.configRepo.publishUpdate({ type: 'queue-updated', queueName, timestamp: new Date().toISOString() });
    } catch (err) {
      return {
        message: `Queue '${queueName}' updated (worker reconcile had issues)`,
        queue,
        workerError: err.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      message: `Queue '${queueName}' updated`,
      queue,
      timestamp: new Date().toISOString(),
    };
  }

  /** Delete a queue */
  @Delete(':queueName')
  async deleteQueue(@Param('queueName') queueName: string) {
    // Remove workers first to free resources
    await this.workerService.removeAllWorkersForQueue(queueName).catch(() => undefined);
    await this.queueService.removeQueue(queueName);
    try {
      await this.configRepo.saveConfig(this.queueService.getQueueConfig());
      await this.configRepo.publishUpdate({ type: 'queue-removed', queueName, timestamp: new Date().toISOString() });
    } catch {}

    return {
      message: `Queue '${queueName}' deleted`,
      queueName,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== CONFIG ENDPOINTS ==========

  /**
   * Get current queue configuration
   */
  @Get('config/current')
  async getCurrentConfig() {
    const config = this.queueService.getQueueConfig();

    return {
      message: 'Current queue configuration',
      config,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reload queue configuration
   */
  @Post('config/reload')
  async reloadConfig() {
    try {
      // Note: This method doesn't exist yet in DynamicQueueService
      // await this.queueService.reloadConfig();
      const config = this.queueService.getQueueConfig();

      return {
        message: 'Queue configuration retrieved (reload not implemented yet)',
        config,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: 'Failed to get configuration',
        details: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== HEALTH CHECK ==========

  /**
   * System health check
   */
  @Get('health/check')
  async healthCheck() {
    const queueStats = await this.queueService.getQueuesStats();
    const workerStats = await this.workerService.getWorkerStats();

    const health = {
      status: 'healthy',
      queues: {
        total: queueStats.totalQueues,
        available: Object.keys(queueStats.queues).length,
      },
      workers: {
        total: workerStats.workers.total,
        active: workerStats.workers.active,
        paused: workerStats.workers.details.filter((w) => w.status === 'paused')
          .length,
      },
      memory: {
        heapUsedMB: workerStats.memory.heapUsedMB,
        heapTotalMB: workerStats.memory.heapTotalMB,
        usagePercent: parseFloat(workerStats.memory.usagePercent) || 0,
      },
      uptime: workerStats.uptime,
    };

    // Determine health status
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

  // ========== ROUTING ENDPOINTS ==========

  /**
   * Get routing patterns (Not implemented yet)
   */
  @Get('routing/patterns')
  async getRoutingPatterns() {
    return {
      message: 'Routing patterns not implemented yet',
      patterns: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test routing for a specific request (Not implemented yet)
   */
  @Post('routing/test')
  async testRouting(@Body() requestData: any) {
    return {
      message: 'Routing test not implemented yet',
      input: requestData,
      determinedQueue: 'standard', // default queue
      timestamp: new Date().toISOString(),
    };
  }

  // ========== GENERAL QUEUE ENDPOINTS (LESS SPECIFIC) ==========

  /**
   * Get all queue configurations and statistics
   */
  @Get()
  async getAllQueues() {
    const stats = await this.queueService.getQueuesStats();
    const config = this.queueService.getQueueConfig();
    const workerStats = await this.workerService.getWorkerStats();

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
   * Test queue by adding a sample job
   */
  @Post(':queueName/test')
  async testQueue(
    @Param('queueName') queueName: string,
    @Body() testData?: any,
  ) {
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
        testData: testJobData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: `Failed to add test job to queue '${queueName}'`,
        details: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get specific queue information (MOST GENERIC - MUST BE LAST)
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
}
