import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { CourseSection, Schedule } from './entities';
import { Course } from '../programs/entities';
import { Term } from '../calendar/entities';
import { Teacher } from '../auth/entities/teacher.entity';
import { CourseSectionService, ScheduleService } from './services';
import { CourseSectionController, ScheduleController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseSection, Schedule, Course, Term, Teacher]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
  ],
  controllers: [CourseSectionController, ScheduleController],
  providers: [CourseSectionService, ScheduleService],
  exports: [CourseSectionService, ScheduleService],
})
export class TeachingModule {}
