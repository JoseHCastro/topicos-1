import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { QueueInterceptor } from './common/interceptors/queue.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar archivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });

  // Servir específicamente los archivos de demo
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/websocket-demo/',
    index: false,
  });

  // Configurar pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Temporalmente cambiado a false
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configurar filtro de excepciones global
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configurar interceptor de colas global
  const queueInterceptor = app.get(QueueInterceptor);
  app.useGlobalInterceptors(queueInterceptor);

  console.log('🚀 Queue Interceptor registered globally');
  console.log('📝 Use POST /queue-control/enable to activate queue system');
  console.log('🔌 WebSocket Demo available at: http://localhost:3000/websocket-demo.html');
  console.log('📋 Polling Demo available at: http://localhost:3000/queue-demo.html');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
