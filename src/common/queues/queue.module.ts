import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamicQueueService } from './dynamic-queue.service';
import { QueueController } from './queue.controller';
import { QueueAdminController } from '../controllers/queue-admin.controller';
import { RedisModule } from '../redis/redis.module';
import { WorkerModule } from '../workers/worker.module';

@Module({
  imports: [ConfigModule, RedisModule, forwardRef(() => WorkerModule)],
  controllers: [QueueController, QueueAdminController],
  providers: [DynamicQueueService],
  exports: [DynamicQueueService],
})
export class QueueModule {}
