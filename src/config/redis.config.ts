import { ConfigService } from '@nestjs/config';

export const redisConfig = {
  provide: 'REDIS_OPTIONS',
  useFactory: (configService: ConfigService) => ({
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get('REDIS_PORT', 6379),
    password: configService.get('REDIS_PASSWORD'), // Sin password para desarrollo local
    db: configService.get('REDIS_DB', 0),

    // Configuración básica sin clustering (single instance)
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10),
    lazyConnect: true,
    maxRetriesPerRequest: null, // BullMQ requiere que sea null
    retryDelayOnFailure: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),

    // Máximo 10 conexiones concurrentes
    family: 4,

    // Log level INFO para debugging
    showFriendlyErrorStack: process.env.NODE_ENV === 'development',
  }),
  inject: [ConfigService],
};

export const redisConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),

  // Configuración de conexión
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10),
  lazyConnect: true,
  maxRetriesPerRequest: null, // BullMQ requiere que sea null
  retryDelayOnFailure: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),

  // Pool de conexiones limitado
  family: 4,
};
