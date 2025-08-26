import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Career, StudyPlan, Subject, Prerequisite } from './entities';
import { CareerService, StudyPlanService, SubjectService, PrerequisiteService } from './services';
import { CareerController, StudyPlanController, SubjectController, PrerequisiteController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Career, StudyPlan, Subject, Prerequisite]),
    AuthModule,
  ],
  controllers: [CareerController, StudyPlanController, SubjectController, PrerequisiteController],
  providers: [CareerService, StudyPlanService, SubjectService, PrerequisiteService],
  exports: [TypeOrmModule, CareerService, StudyPlanService, SubjectService, PrerequisiteService],
})
export class ProgramsModule {}