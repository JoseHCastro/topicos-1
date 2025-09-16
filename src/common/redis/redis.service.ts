import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  // Métodos básicos para la cola universal
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setex(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.redisClient.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redisClient.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }

  async lpush(key: string, value: string): Promise<number> {
    return this.redisClient.lpush(key, value);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redisClient.lrange(key, start, stop);
  }

  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    return this.redisClient.ltrim(key, start, stop);
  }

  // Método para obtener info de Redis para debugging
  async getInfo(): Promise<string> {
    return this.redisClient.info();
  }

  // Método para obtener el cliente Redis directamente (para BullMQ)
  getClient(): Redis {
    return this.redisClient;
  }

  // Health check básico
  async isConnected(): Promise<boolean> {
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}
