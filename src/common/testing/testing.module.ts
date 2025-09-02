import { Module } from '@nestjs/common';
import { LoadTestService } from './load-test.service';
import { LoadTestController } from './load-test.controller';
import { QueueModule } from '../queues/queue.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [QueueModule, RedisModule],
  controllers: [LoadTestController],
  providers: [LoadTestService],
  exports: [LoadTestService],
})
export class TestingModule {}
