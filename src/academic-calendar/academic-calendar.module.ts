import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Period, Management } from './entities';
import { ManagementService, PeriodService } from './services';
import { ManagementController, PeriodController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Period, Management]),
    AuthModule,
  ],
  controllers: [ManagementController, PeriodController],
  providers: [ManagementService, PeriodService],
  exports: [TypeOrmModule, ManagementService, PeriodService],
})
export class AcademicCalendarModule {}