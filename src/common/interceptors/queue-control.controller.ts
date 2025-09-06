import { Controller, Get, Post, Param, Body, Delete } from '@nestjs/common';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { QueueConfigService } from './queue-config.service';

@Controller('queue-control')
export class QueueControlController {
  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly queueConfig: QueueConfigService,
  ) {}

  @Get('status')
  getQueueSystemStatus() {
    const isEnabled = this.queueConfig.isQueueEnabled();
    const exclusions = this.queueConfig.getExclusions();

    return {
      queueSystemEnabled: isEnabled,
      status: isEnabled ? 'active' : 'bypassed',
      message: isEnabled
        ? 'All requests are being queued'
        : 'Requests are processed directly',
      exclusions: {
        total: exclusions.default.length + exclusions.custom.length + exclusions.env.length,
        default: exclusions.default,
        custom: exclusions.custom,
        environment: exclusions.env,
      },
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

  // ========== NUEVOS ENDPOINTS PARA EXCLUSIONES ==========

  @Get('exclusions')
  getExclusions() {
    const exclusions = this.queueConfig.getExclusions();

    return {
      message: 'Current queue exclusions',
      exclusions,
      totalCount: exclusions.default.length + exclusions.custom.length + exclusions.env.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('exclusions')
  addExclusion(@Body() body: { urlPattern: string }) {
    if (!body.urlPattern) {
      return {
        error: 'urlPattern is required',
        example: { urlPattern: '/my-endpoint' },
        timestamp: new Date().toISOString(),
      };
    }

    this.queueConfig.addExclusion(body.urlPattern);

    return {
      message: `Exclusion added: ${body.urlPattern}`,
      urlPattern: body.urlPattern,
      exclusions: this.queueConfig.getExclusions(),
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('exclusions/:pattern')
  removeExclusion(@Param('pattern') pattern: string) {
    // Decodificar el patrón URL
    const decodedPattern = decodeURIComponent(pattern);
    
    this.queueConfig.removeExclusion(decodedPattern);

    return {
      message: `Exclusion removed: ${decodedPattern}`,
      urlPattern: decodedPattern,
      exclusions: this.queueConfig.getExclusions(),
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('exclusions')
  clearCustomExclusions() {
    this.queueConfig.clearCustomExclusions();

    return {
      message: 'All custom exclusions cleared',
      exclusions: this.queueConfig.getExclusions(),
      timestamp: new Date().toISOString(),
    };
  }

  // Endpoint para testear el sistema de colas
  @Get('test-job/:queueType')
  async testQueue(
    @Param('queueType') queueType: 'critical' | 'standard' | 'background',
  ) {
    const jobId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const testJobData = {
      id: jobId,
      method: 'GET',
      url: `/test/${queueType}`,
      headers: {
        'content-type': 'application/json',
        'user-agent': 'queue-test-client/1.0',
      },
      timestamp: Date.now(),
    };

    // Validate queue availability in dynamic system
    if (!this.queueService.isQueueAvailable(queueType)) {
      return {
        error: `Queue '${queueType}' is not available`,
        availableQueues: this.queueService.getAvailableQueues(),
        timestamp: new Date().toISOString(),
      };
    }

    const job = await this.queueService.addJobToQueue(queueType, testJobData);

    return {
      message: `Test job added to ${queueType} queue`,
      jobId: job.id,
      queueType,
      checkStatusUrl: `/queues/job/${job.id}/status`,
      timestamp: new Date().toISOString(),
    };
  }
}
