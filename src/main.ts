import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { QueueInterceptor } from './common/interceptors/queue.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar pipes globales
  app.useGlobalPipes(
    new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true 
    })
  );
  
  // Configurar filtro de excepciones global
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Configurar interceptor de colas global
  const queueInterceptor = app.get(QueueInterceptor);
  app.useGlobalInterceptors(queueInterceptor);
  
  console.log('🚀 Queue Interceptor registered globally');
  console.log('📝 Use POST /queue-control/enable to activate queue system');
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
