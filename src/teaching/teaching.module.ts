import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseSection, Schedule } from './entities';
import { CourseSectionService, ScheduleService } from './services';
import { CourseSectionController, ScheduleController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([CourseSection, Schedule])],
  controllers: [CourseSectionController, ScheduleController],
  providers: [CourseSectionService, ScheduleService],
  exports: [CourseSectionService, ScheduleService],
})
export class TeachingModule {}