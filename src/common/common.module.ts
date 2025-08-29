import { Global, Module } from '@nestjs/common';
import { TransactionService, PaginationService } from './services';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';

@Global()
@Module({
  imports: [RedisModule, HealthModule],
  providers: [TransactionService, PaginationService],
  exports: [TransactionService, PaginationService, RedisModule],
})
export class CommonModule {}