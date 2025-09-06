import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { CommonModule } from './common';
import { WorkerModule } from './common/workers/worker.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';
import { WebSocketModule } from './common/websockets/websocket.module';
import { AuthModule } from './auth/auth.module';
import { ProgramsModule } from './programs/programs.module';
import { CalendarModule } from './calendar/calendar.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { TeachingModule } from './teaching/teaching.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AssessmentsModule } from './assessments/assessments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    CommonModule,
    // Importar módulos con dependencias circulares después del CommonModule
    WorkerModule,
    MonitoringModule,
    WebSocketModule,
    AuthModule,
    ProgramsModule,
    CalendarModule,
    FacilitiesModule,
    TeachingModule,
    EnrollmentsModule,
    AssessmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
