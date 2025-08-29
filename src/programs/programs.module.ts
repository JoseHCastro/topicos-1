import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { DegreeProgram, StudyPlan, Course, Prerequisite, Level } from './entities';
import { DegreeProgramService, StudyPlanService, CourseService, PrerequisiteService, LevelService } from './services';
import { DegreeProgramController, StudyPlanController, CourseController, PrerequisiteController, LevelController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DegreeProgram, StudyPlan, Course, Prerequisite, Level]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
  ],
  controllers: [DegreeProgramController, StudyPlanController, CourseController, PrerequisiteController, LevelController],
  providers: [DegreeProgramService, StudyPlanService, CourseService, PrerequisiteService, LevelService],
  exports: [TypeOrmModule, DegreeProgramService, StudyPlanService, CourseService, PrerequisiteService, LevelService],
})
export class ProgramsModule {}
