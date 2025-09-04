import { Module, forwardRef } from '@nestjs/common';
import { DynamicWorkerService } from './dynamic-worker.service';
import { QueueModule } from '../queues/queue.module';
import { RedisModule } from '../redis/redis.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { CacheModule } from '../cache/cache.module';
import { WebSocketModule } from '../websockets/websocket.module';

@Module({
  imports: [
    QueueModule, 
    RedisModule, 
    MonitoringModule, 
    CacheModule.forRoot(),
    forwardRef(() => WebSocketModule),
  ],
  providers: [DynamicWorkerService],
  exports: [DynamicWorkerService],
})
export class WorkerModule {}
