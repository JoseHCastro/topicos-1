import { Injectable, Logger } from '@nestjs/common';
import { WorkerInfo } from './worker-factory.service';

@Injectable()
export class WorkerHealthService {
  private readonly logger = new Logger(WorkerHealthService.name);

  getHealthStatus(workers: WorkerInfo[]): { status: 'healthy' | 'warning' | 'critical'; details: any } {
    const activeWorkers = workers.filter(w => w.status === 'active');
    const totalWorkers = workers.length;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const details: any = {
      totalWorkers,
      activeWorkers: activeWorkers.length,
      workerHealth: activeWorkers.length / Math.max(totalWorkers, 1),
      inactiveWorkers: totalWorkers - activeWorkers.length,
    };

    if (totalWorkers === 0) {
      status = 'critical';
      details.issue = 'No workers available';
      details.severity = 'critical';
    } else if (activeWorkers.length < totalWorkers * 0.5) {
      status = 'critical';
      details.issue = 'More than 50% of workers are inactive';
      details.severity = 'critical';
    } else if (activeWorkers.length < totalWorkers * 0.8) {
      status = 'warning';
      details.issue = 'Some workers are inactive';
      details.severity = 'warning';
    }

    this.logHealthStatus(status, details);
    return { status, details };
  }

  private logHealthStatus(status: string, details: any): void {
    if (status === 'critical') {
      this.logger.error(`🚨 Worker Health CRITICAL: ${details.issue}`);
    } else if (status === 'warning') {
      this.logger.warn(`⚠️ Worker Health WARNING: ${details.issue}`);
    } else {
      this.logger.debug(`✅ Worker Health OK: ${details.activeWorkers}/${details.totalWorkers} workers active`);
    }
  }

  updateWorkerStatus(workers: Map<string, WorkerInfo>, workerId: string, status: 'active' | 'paused' | 'stopped'): void {
    const workerInfo = workers.get(workerId);
    if (workerInfo) {
      workerInfo.status = status;
      this.logger.debug(`📊 Worker '${workerId}' status updated to '${status}'`);
    } else {
      this.logger.warn(`⚠️ Attempted to update status for unknown worker '${workerId}'`);
    }
  }

  getWorkersForQueue(workers: WorkerInfo[], queueName: string): WorkerInfo[] {
    return workers.filter(worker => worker.queueName === queueName);
  }

  validateWorkerLimits(queueName: string, existingWorkers: WorkerInfo[], maxWorkers: number): void {
    if (existingWorkers.length >= maxWorkers) {
      throw new Error(`Maximum workers (${maxWorkers}) already reached for queue '${queueName}'`);
    }
  }

  validateQueueHasWorkers(queueName: string, workers: WorkerInfo[]): void {
    if (workers.length === 0) {
      throw new Error(`No workers found for queue '${queueName}'`);
    }
  }
}