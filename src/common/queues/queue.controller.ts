import { Controller, Get, Param } from '@nestjs/common';
import { QueueService } from '../queues/queue.service';

@Controller('queues')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('stats')
  async getQueuesStats() {
    const stats = await this.queueService.getQueuesStats();

    return {
      timestamp: new Date().toISOString(),
      queues: stats,
      status: 'healthy',
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

      return {
        status: 'healthy',
        message: 'All queues are operational',
        queues: {
          critical: stats.critical.waiting + ' jobs waiting',
          standard: stats.standard.waiting + ' jobs waiting',
          background: stats.background.waiting + ' jobs waiting',
        },
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
}
