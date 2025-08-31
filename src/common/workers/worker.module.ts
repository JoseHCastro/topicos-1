import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { QueueModule } from '../queues/queue.module';
import { RedisModule } from '../redis/redis.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [QueueModule, RedisModule, MonitoringModule],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
