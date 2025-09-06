import { Module, forwardRef } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { JobStatusService } from './job-status.service';
import { QueueModule } from '../queues/queue.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [forwardRef(() => QueueModule), RedisModule],
  providers: [WebSocketGateway, WebSocketService, JobStatusService],
  exports: [WebSocketGateway, WebSocketService, JobStatusService],
})
export class WebSocketModule {}