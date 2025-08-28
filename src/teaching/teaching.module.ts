import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { CourseSection, Schedule } from './entities';
import { CourseSectionService, ScheduleService } from './services';
import { CourseSectionController, ScheduleController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseSection, Schedule]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
  ],
  controllers: [CourseSectionController, ScheduleController],
  providers: [CourseSectionService, ScheduleService],
  exports: [CourseSectionService, ScheduleService],
})
export class TeachingModule {}