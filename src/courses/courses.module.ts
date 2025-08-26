import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Classroom, Schedule, SubjectGroup } from './entities';
import { ClassroomService, ScheduleService, SubjectGroupService } from './services';
import { ClassroomController, ScheduleController, SubjectGroupController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Classroom, Schedule, SubjectGroup]),
    AuthModule,
  ],
  controllers: [ClassroomController, ScheduleController, SubjectGroupController],
  providers: [ClassroomService, ScheduleService, SubjectGroupService],
  exports: [TypeOrmModule, ClassroomService, ScheduleService, SubjectGroupService],
})
export class CoursesModule {}