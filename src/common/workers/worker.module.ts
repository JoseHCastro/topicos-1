import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { QueueModule } from '../queues/queue.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [QueueModule, RedisModule],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}