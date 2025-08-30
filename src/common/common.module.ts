import { Global, Module } from '@nestjs/common';
import { TransactionService, PaginationService } from './services';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queues/queue.module';
import { InterceptorModule } from './interceptors/interceptor.module';

@Global()
@Module({
  imports: [RedisModule, HealthModule, QueueModule, InterceptorModule],
  providers: [TransactionService, PaginationService],
  exports: [TransactionService, PaginationService, RedisModule, QueueModule, InterceptorModule],
})
export class CommonModule {}