import { Global, Module } from '@nestjs/common';
import { TransactionService, PaginationService } from './services';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queues/queue.module';
import { InterceptorModule } from './interceptors/interceptor.module';
import { WorkerModule } from './workers/worker.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Global()
@Module({
  imports: [
    RedisModule,
    HealthModule,
    QueueModule,
    InterceptorModule,
    WorkerModule,
    MonitoringModule,
  ],
  providers: [TransactionService, PaginationService],
  exports: [
    TransactionService,
    PaginationService,
    RedisModule,
    QueueModule,
    WorkerModule,
    MonitoringModule,
  ],
})
export class CommonModule {}
