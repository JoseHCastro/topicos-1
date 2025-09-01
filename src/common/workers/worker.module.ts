import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { QueueModule } from '../queues/queue.module';
import { RedisModule } from '../redis/redis.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [QueueModule, RedisModule, MonitoringModule, CacheModule.forRoot()],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
