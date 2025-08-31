import { Module } from '@nestjs/common';
import { QueueInterceptor } from './queue.interceptor';
import { QueueConfigService } from './queue-config.service';
import { QueueControlController } from './queue-control.controller';
import { QueueModule } from '../queues/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [QueueControlController],
  providers: [QueueInterceptor, QueueConfigService],
  exports: [QueueInterceptor, QueueConfigService],
})
export class InterceptorModule {}
