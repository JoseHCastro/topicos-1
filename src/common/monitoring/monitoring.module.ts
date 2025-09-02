import { Module, forwardRef } from '@nestjs/common';
import { ResourceMonitorService } from './resource-monitor.service';
import { ConnectionPoolService } from './connection-pool.service';
import { MonitoringController } from './monitoring.controller';
import { WorkerModule } from '../workers/worker.module';
import { WebSocketModule } from '../websockets/websocket.module';

@Module({
  imports: [
    forwardRef(() => WorkerModule),
    forwardRef(() => WebSocketModule),
  ],
  providers: [ResourceMonitorService, ConnectionPoolService],
  controllers: [MonitoringController],
  exports: [ResourceMonitorService, ConnectionPoolService],
})
export class MonitoringModule {}
