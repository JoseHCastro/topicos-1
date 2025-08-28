import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DegreeProgram, StudyPlan, Course, Prerequisite, Level } from './entities';
import { CareerService, StudyPlanService, SubjectService, PrerequisiteService } from './services';
import { CareerController, StudyPlanController, SubjectController, PrerequisiteController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DegreeProgram, StudyPlan, Course, Prerequisite, Level]),
    AuthModule,
  ],
  controllers: [CareerController, StudyPlanController, SubjectController, PrerequisiteController],
  providers: [CareerService, StudyPlanService, SubjectService, PrerequisiteService],
  exports: [TypeOrmModule, CareerService, StudyPlanService, SubjectService, PrerequisiteService],
})
export class ProgramsModule {}