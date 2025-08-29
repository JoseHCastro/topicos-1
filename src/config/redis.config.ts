import { ConfigService } from '@nestjs/config';

export const redisConfig = {
  provide: 'REDIS_OPTIONS',
  useFactory: (configService: ConfigService) => ({
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get('REDIS_PORT', 6379),
    password: configService.get('REDIS_PASSWORD'), // Sin password para desarrollo local
    db: configService.get('REDIS_DB', 0),
    
    // Configuración básica sin clustering (single instance)
    connectTimeout: 5000, // Timeout de conexión de 5 segundos
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailure: 100,
    
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
  connectTimeout: 5000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailure: 100,
  
  // Pool de conexiones limitado
  family: 4,
};