import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConnectionOptions } from '../../config/redis.config';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisOptions = {
          ...redisConnectionOptions,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        };

        const redis = new Redis(redisOptions);

        // Log de conexión para debugging (solo una vez)
        let connected = false;
        redis.on('connect', () => {
          if (!connected) {
            console.log('✅ Redis connected successfully');
            connected = true;
          }
        });

        redis.on('error', (err) => {
          console.error('❌ Redis connection error:', err);
          connected = false;
        });

        redis.on('ready', () => {
          if (!connected) {
            console.log('🚀 Redis ready to accept commands');
          }
        });

        return redis;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
