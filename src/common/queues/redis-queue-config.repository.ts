import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { IQueueConfigRepository, QueueConfigEvent } from './queue-config.repository';
import { QueueSystemConfig } from './queue-config.interface';

@Injectable()
export class RedisQueueConfigRepository implements IQueueConfigRepository {
  private readonly logger = new Logger(RedisQueueConfigRepository.name);
  private readonly configKey = process.env.QUEUE_CONFIG_KEY || 'queues:config';
  private readonly channel = process.env.QUEUE_CONFIG_CHANNEL || 'queues:config:events';

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('REDIS_SUBSCRIBER') private readonly subscriber: Redis,
  ) {}

  async getConfig(): Promise<QueueSystemConfig | null> {
    try {
      const data = await this.redis.get(this.configKey);
      if (!data) return null;
      return JSON.parse(data) as QueueSystemConfig;
    } catch (err) {
      this.logger.warn(`Failed to read queue config from Redis: ${err.message}`);
      return null;
    }
  }

  async saveConfig(config: QueueSystemConfig): Promise<void> {
    try {
      await this.redis.set(this.configKey, JSON.stringify(config));
    } catch (err) {
      this.logger.error(`Failed to save queue config to Redis: ${err.message}`);
      throw err;
    }
  }

  async publishUpdate(event: QueueConfigEvent): Promise<void> {
    try {
      await this.redis.publish(this.channel, JSON.stringify(event));
    } catch (err) {
      this.logger.warn(`Failed to publish config event: ${err.message}`);
    }
  }

  async subscribe(onMessage: (event: QueueConfigEvent) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(this.channel);
      this.subscriber.on('message', (_channel, message) => {
        try {
          const evt = JSON.parse(message) as QueueConfigEvent;
          onMessage(evt);
        } catch (err) {
          this.logger.warn(`Invalid config event payload: ${err.message}`);
        }
      });
      this.logger.log(`📣 Subscribed to config channel '${this.channel}'`);
    } catch (err) {
      this.logger.error(`Failed to subscribe to config updates: ${err.message}`);
      throw err;
    }
  }
}

