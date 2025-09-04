import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueService } from './queue.service';
import { DynamicQueueService } from './dynamic-queue.service';
import { QueueController } from './queue.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ConfigModule, RedisModule],
  controllers: [QueueController],
  providers: [QueueService, DynamicQueueService],
  exports: [QueueService, DynamicQueueService],
})
export class QueueModule {}
