import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicYear, Term } from './entities';
import { ManagementService, PeriodService } from './services';
import { ManagementController, PeriodController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicYear, Term])],
  controllers: [ManagementController, PeriodController],
  providers: [ManagementService, PeriodService],
  exports: [TypeOrmModule, ManagementService, PeriodService],
})
export class CalendarModule {}