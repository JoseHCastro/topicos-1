import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AcademicYear, Term } from './entities';
import { ManagementService, PeriodService } from './services';
import { ManagementController, PeriodController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcademicYear, Term]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
  ],
  controllers: [ManagementController, PeriodController],
  providers: [ManagementService, PeriodService],
  exports: [TypeOrmModule, ManagementService, PeriodService],
})
export class CalendarModule {}
