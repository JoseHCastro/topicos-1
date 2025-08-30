import { Controller, Get, Post, Param } from '@nestjs/common';
import { QueueService } from '../queues/queue.service';
import { QueueConfigService } from '../interceptors/queue-config.service';

@Controller('queue-control')
export class QueueControlController {
  constructor(
    private readonly queueService: QueueService,
    private readonly queueConfig: QueueConfigService,
  ) {}

  @Get('status')
  getQueueSystemStatus() {
    const isEnabled = this.queueConfig.isQueueEnabled();
    
    return {
      queueSystemEnabled: isEnabled,
      status: isEnabled ? 'active' : 'bypassed',
      message: isEnabled 
        ? 'All requests are being queued' 
        : 'Requests are processed directly',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('enable')
  enableQueueSystem() {
    this.queueConfig.enableQueue();
    
    return {
      message: 'Queue system enabled',
      status: 'active',
      note: 'All new requests will go through queues',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('disable')
  disableQueueSystem() {
    this.queueConfig.disableQueue();
    
    return {
      message: 'Queue system disabled',
      status: 'bypassed',
      note: 'Requests will be processed directly',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('toggle')
  toggleQueueSystem() {
    const newStatus = this.queueConfig.toggleQueue();
    
    return {
      message: `Queue system ${newStatus ? 'enabled' : 'disabled'}`,
      status: newStatus ? 'active' : 'bypassed',
      queueSystemEnabled: newStatus,
      timestamp: new Date().toISOString(),
    };
  }

  // Endpoint para testear el sistema de colas
  @Get('test-job/:queueType')
  async testQueue(@Param('queueType') queueType: 'critical' | 'standard' | 'background') {
    const jobId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const testJobData = {
      id: jobId,
      method: 'GET',
      url: `/test/${queueType}`,
      timestamp: Date.now(),
    };

    let job;
    switch (queueType) {
      case 'critical':
        job = await this.queueService.addCriticalJob(testJobData);
        break;
      case 'standard':
        job = await this.queueService.addStandardJob(testJobData);
        break;
      case 'background':
        job = await this.queueService.addBackgroundJob(testJobData);
        break;
    }

    return {
      message: `Test job added to ${queueType} queue`,
      jobId: job.id,
      queueType,
      checkStatusUrl: `/queues/job/${job.id}/status`,
      timestamp: new Date().toISOString(),
    };
  }
}