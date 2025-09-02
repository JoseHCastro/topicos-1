import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { QueueInterceptor } from './common/interceptors/queue.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema de Inscripciones UAGRM')
    .setDescription('API para el sistema de inscripciones universitarias de la UAGRM')
    .setVersion('1.0')
    .addTag('Autenticación', 'Endpoints para registro, login y gestión de usuarios')
    .addTag('Inscripciones', 'Gestión de inscripciones de estudiantes')
    .addTag('Materias', 'Gestión del catálogo de materias')
    .addTag('Programas de Grado', 'Gestión de carreras y programas académicos')
    .addTag('Secciones de Materias', 'Gestión de secciones y grupos de materias')
    .addTag('Períodos Académicos', 'Gestión de términos y períodos académicos')
    .addTag('Aulas', 'Gestión de aulas y espacios físicos')
    .addTag('Calificaciones', 'Sistema de evaluación y calificaciones')
    .addTag('Horarios', 'Gestión de horarios académicos')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT obtenido del endpoint /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelsExpandDepth: -1, // Oculta la sección de modelos/schemas
      defaultModelExpandDepth: -1,  // Oculta los detalles de los modelos
      docExpansion: 'none',         // No expande automáticamente las secciones
      filter: true,                 // Habilita el filtro de búsqueda
      showExtensions: false,        // Oculta extensiones
      showCommonExtensions: false,  // Oculta extensiones comunes
    },
    customCss: `
      .swagger-ui .models {
        display: none !important;
      }
      .swagger-ui .model-container {
        display: none !important;
      }
    `,
  });

  console.log('🚀 Queue Interceptor registered globally');
  console.log('📝 Use POST /queue-control/enable to activate queue system');
  console.log('🔌 WebSocket Demo available at: http://localhost:3000/websocket-demo.html');
  console.log('📋 Polling Demo available at: http://localhost:3000/queue-demo.html');
  console.log('📚 API Documentation available at: http://localhost:3000/api-docs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
