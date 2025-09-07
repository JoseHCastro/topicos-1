import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamicQueueService } from './dynamic-queue.service';
import { RedisQueueConfigRepository } from './redis-queue-config.repository';
import { QUEUE_CONFIG_REPOSITORY } from './queue-config.repository';
import { QueueController } from './queue.controller';
import { QueueAdminController } from '../controllers/queue-admin.controller';
import { RedisModule } from '../redis/redis.module';
import { WorkerModule } from '../workers/worker.module';

@Module({
  imports: [ConfigModule, RedisModule, forwardRef(() => WorkerModule)],
  controllers: [QueueController, QueueAdminController],
  providers: [
    DynamicQueueService,
    { provide: QUEUE_CONFIG_REPOSITORY, useClass: RedisQueueConfigRepository },
  ],
  exports: [DynamicQueueService, QUEUE_CONFIG_REPOSITORY],
})
export class QueueModule {}
