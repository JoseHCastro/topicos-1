import { Module, forwardRef } from '@nestjs/common';
import { DynamicWorkerService } from './dynamic-worker.service';
import { WorkerFactoryService } from './worker-factory.service';
import { WorkerHealthService } from './worker-health.service';
import { JobProcessorService } from './job-processor.service';
import { HttpExecutorService } from './http-executor.service';
import { JobCacheService } from './job-cache.service';
import { WorkerResourceManagerService } from './worker-resource-manager.service';
import { WorkerStatsService } from './worker-stats.service';
import { QueueModule } from '../queues/queue.module';
import { RedisModule } from '../redis/redis.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { CacheModule } from '../cache/cache.module';
import { WebSocketModule } from '../websockets/websocket.module';

@Module({
  imports: [
    forwardRef(() => QueueModule), 
    RedisModule, 
    MonitoringModule, 
    CacheModule.forRoot(),
    forwardRef(() => WebSocketModule),
  ],
  providers: [
    DynamicWorkerService,
    WorkerFactoryService,
    WorkerHealthService,
    JobProcessorService,
    HttpExecutorService,
    JobCacheService,
    WorkerResourceManagerService,
    WorkerStatsService,
  ],
  exports: [
    DynamicWorkerService,
    WorkerFactoryService,
    WorkerHealthService,
    JobProcessorService,
    HttpExecutorService,
    JobCacheService,
    WorkerResourceManagerService,
    WorkerStatsService,
  ],
})
export class WorkerModule {}
