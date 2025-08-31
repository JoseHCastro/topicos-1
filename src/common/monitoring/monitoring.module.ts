import { Module, forwardRef } from '@nestjs/common';
import { ResourceMonitorService } from './resource-monitor.service';
import { ConnectionPoolService } from './connection-pool.service';
import { MonitoringController } from './monitoring.controller';
import { WorkerModule } from '../workers/worker.module';

@Module({
  imports: [forwardRef(() => WorkerModule)],
  providers: [ResourceMonitorService, ConnectionPoolService],
  controllers: [MonitoringController],
  exports: [ResourceMonitorService, ConnectionPoolService],
})
export class MonitoringModule {}
