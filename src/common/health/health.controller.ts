import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly redisService: RedisService) {}

  @Get('redis')
  async checkRedis() {
    const isConnected = await this.redisService.isConnected();

    if (!isConnected) {
      return {
        status: 'error',
        service: 'redis',
        message: 'Redis connection failed',
        timestamp: new Date().toISOString(),
      };
    }

    const info = await this.redisService.getInfo();
    const memoryInfo = info
      .split('\n')
      .filter((line) => line.startsWith('used_memory_human:'))
      .map((line) => line.split(':')[1]?.trim())[0];

    return {
      status: 'healthy',
      service: 'redis',
      message: 'Redis connection successful',
      memory_usage: memoryInfo,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  async checkAll() {
    const redisHealth = await this.checkRedis();

    return {
      status: redisHealth.status === 'healthy' ? 'healthy' : 'degraded',
      services: {
        redis: redisHealth,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
