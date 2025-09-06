import { Global, Module } from '@nestjs/common';
import { TransactionService, PaginationService } from './services';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queues/queue.module';
import { InterceptorModule } from './interceptors/interceptor.module';
import { WorkerModule } from './workers/worker.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { WebSocketModule } from './websockets/websocket.module';
import { TestingModule } from './testing/testing.module';

@Global()
@Module({
  imports: [
    RedisModule,
    HealthModule,
    QueueModule,
    InterceptorModule,
    // Remover dependencias circulares temporalmente
    // WorkerModule, MonitoringModule, WebSocketModule se manejan por separado
    TestingModule,
  ],
  providers: [TransactionService, PaginationService],
  exports: [
    TransactionService,
    PaginationService,
    RedisModule,
    QueueModule,
    TestingModule,
  ],
})
export class CommonModule {}
