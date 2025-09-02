import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface JobStatusUpdate {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'progress';
  result?: any;
  error?: string;
  progress?: number;
  timestamp: number;
  queueName?: string;
  estimatedTimeRemaining?: number;
}

@Injectable()
export class JobStatusService extends EventEmitter {
  private readonly logger = new Logger(JobStatusService.name);
  private readonly jobStatuses = new Map<string, JobStatusUpdate>();

  /**
   * Actualiza el estado de un job y emite el evento correspondiente
   */
  updateJobStatus(update: JobStatusUpdate): void {
    this.logger.debug(
      `📡 Job ${update.jobId} status update: ${update.status}`,
    );

    // Guardar el estado actual
    this.jobStatuses.set(update.jobId, {
      ...update,
      timestamp: Date.now(),
    });

    // Emitir evento para WebSocket clients
    this.emit('job-status-update', update);
  }

  /**
   * Obtiene el estado actual de un job
   */
  getJobStatus(jobId: string): JobStatusUpdate | null {
    return this.jobStatuses.get(jobId) || null;
  }

  /**
   * Marca un job como en cola
   */
  markJobQueued(jobId: string, queueName: string): void {
    this.updateJobStatus({
      jobId,
      status: 'queued',
      queueName,
      timestamp: Date.now(),
    });
  }

  /**
   * Marca un job como en procesamiento
   */
  markJobProcessing(jobId: string, queueName: string): void {
    this.updateJobStatus({
      jobId,
      status: 'processing',
      queueName,
      timestamp: Date.now(),
    });
  }

  /**
   * Actualiza el progreso de un job
   */
  updateJobProgress(
    jobId: string,
    progress: number,
    estimatedTimeRemaining?: number,
  ): void {
    this.updateJobStatus({
      jobId,
      status: 'progress',
      progress,
      estimatedTimeRemaining,
      timestamp: Date.now(),
    });
  }

  /**
   * Marca un job como completado
   */
  markJobCompleted(jobId: string, result: any): void {
    this.updateJobStatus({
      jobId,
      status: 'completed',
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Marca un job como fallido
   */
  markJobFailed(jobId: string, error: string): void {
    this.updateJobStatus({
      jobId,
      status: 'failed',
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Limpia jobs antiguos (más de 1 hora)
   */
  cleanupOldJobs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let cleaned = 0;

    const entries = Array.from(this.jobStatuses.entries());
    for (const [jobId, status] of entries) {
      if (status.timestamp < oneHourAgo) {
        this.jobStatuses.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`🧹 Cleaned up ${cleaned} old job statuses`);
    }
  }

  /**
   * Obtiene estadísticas de jobs activos
   */
  getJobStatistics(): {
    total: number;
    byStatus: Record<string, number>;
    oldest: number;
  } {
    const stats = {
      total: this.jobStatuses.size,
      byStatus: {} as Record<string, number>,
      oldest: Date.now(),
    };

    const values = Array.from(this.jobStatuses.values());
    for (const status of values) {
      stats.byStatus[status.status] = (stats.byStatus[status.status] || 0) + 1;
      if (status.timestamp < stats.oldest) {
        stats.oldest = status.timestamp;
      }
    }

    return stats;
  }
}