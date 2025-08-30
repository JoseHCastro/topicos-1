import { Global, Module } from '@nestjs/common';
import { TransactionService, PaginationService } from './services';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queues/queue.module';

@Global()
@Module({
  imports: [RedisModule, HealthModule, QueueModule],
  providers: [TransactionService, PaginationService],
  exports: [TransactionService, PaginationService, RedisModule, QueueModule],
})
export class CommonModule {}