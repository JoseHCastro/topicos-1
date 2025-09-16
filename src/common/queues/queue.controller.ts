import { Controller, Get, Param, Query } from '@nestjs/common';
import { DynamicQueueService } from '../queues/dynamic-queue.service';

@Controller('queues')
export class QueueController {
  constructor(private readonly queueService: DynamicQueueService) {}

  @Get('status')
  async getBatchJobStatus(@Query('ids') ids: string) {
    if (!ids) {
      return {
        error: 'Parameter "ids" is required',
        example: '/queues/status?ids=job1,job2,job3',
        timestamp: new Date().toISOString(),
      };
    }

    const jobIds = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
    
    if (jobIds.length === 0) {
      return {
        error: 'No valid job IDs provided',
        timestamp: new Date().toISOString(),
      };
    }

    // Limitar a máximo 50 jobs por batch para evitar sobrecarga
    if (jobIds.length > 50) {
      return {
        error: 'Maximum 50 job IDs allowed per batch request',
        provided: jobIds.length,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const statuses = await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const status = await this.queueService.getJobStatus(jobId);
            return {
              jobId,
              ...status,
              error: null,
            };
          } catch (error) {
            return {
              jobId,
              status: 'not_found',
              error: error.message || 'Job not found',
              result: null,
              returnvalue: null,
              failedReason: null,
              processedOn: null,
              finishedOn: null,
            };
          }
        })
      );

      // Estadísticas del batch
      const completed = statuses.filter(s => s.status === 'completed').length;
      const failed = statuses.filter(s => s.status === 'failed').length;
      const processing = statuses.filter(s => s.status === 'active').length;
      const waiting = statuses.filter(s => s.status === 'waiting').length;
      const notFound = statuses.filter(s => s.status === 'not_found').length;

      return {
        jobs: statuses,
        summary: {
          total: jobIds.length,
          completed,
          failed,
          processing,
          waiting,
          notFound,
          successRate: jobIds.length > 0 ? ((completed / (completed + failed || 1)) * 100).toFixed(1) : '0',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: 'Error fetching batch job statuses',
        details: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('stats')
  async getQueuesStats() {
    const stats = await this.queueService.getQueuesStats();

    return {
      timestamp: new Date().toISOString(),
      queues: stats,
      status: 'healthy',
    };
  }

  @Get('results/success')
  async getSuccessfulResults(
    @Query('limit') limit?: string,
    @Query('queue') queue?: string,
  ) {
    const parsedLimit = this.parseLimit(limit);
    const queueName = queue?.trim() || undefined;
    const jobs = await this.queueService.getCompletedJobResults(
      parsedLimit,
      queueName,
    );

    return {
      jobs,
      meta: {
        total: jobs.length,
        limit: parsedLimit,
        queue: queueName ?? null,
        type: 'success',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('results/failure')
  async getFailedResults(
    @Query('limit') limit?: string,
    @Query('queue') queue?: string,
  ) {
    const parsedLimit = this.parseLimit(limit);
    const queueName = queue?.trim() || undefined;
    const jobs = await this.queueService.getFailedJobResults(
      parsedLimit,
      queueName,
    );

    return {
      jobs,
      meta: {
        total: jobs.length,
        limit: parsedLimit,
        queue: queueName ?? null,
        type: 'failure',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('job/:jobId/status')
  async getJobStatus(@Param('jobId') jobId: string) {
    const jobStatus = await this.queueService.getJobStatus(jobId);

    if (!jobStatus) {
      return {
        error: 'Job not found',
        jobId,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      ...jobStatus,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  async checkQueuesHealth() {
    try {
      const stats = await this.queueService.getQueuesStats();

      // Crear resumen de salud usando la nueva estructura
      const queueSummary: Record<string, string> = {};
      Object.keys(stats.queues).forEach(queueName => {
        const queue = stats.queues[queueName];
        queueSummary[queueName] = `${queue.waiting} jobs waiting`;
      });

      return {
        status: 'healthy',
        message: 'All queues are operational',
        queues: queueSummary,
        totalQueues: stats.totalQueues,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Queue health check failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  private parseLimit(limit?: string): number {
    const defaultLimit = 50;

    if (!limit) {
      return defaultLimit;
    }

    const parsed = parseInt(limit, 10);

    if (Number.isNaN(parsed) || parsed <= 0) {
      return defaultLimit;
    }

    return Math.min(parsed, 500);
  }
}
