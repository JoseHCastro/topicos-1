import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { User } from '../auth/entities/user.entity';
import { Admin } from '../auth/entities/admin.entity';
import { Teacher } from '../auth/entities/teacher.entity';
import { Student } from '../auth/entities/student.entity';
import { AcademicYear } from '../calendar/entities/academic-year.entity';
import { Term } from '../calendar/entities/term.entity';
import { Classroom } from '../facilities/entities/classroom.entity';
import { Level } from '../programs/entities/level.entity';
import { DegreeProgram } from '../programs/entities/degree-program.entity';
import { StudyPlan } from '../programs/entities/study-plan.entity';
import { Course } from '../programs/entities/course.entity';
import { Prerequisite } from '../programs/entities/prerequisite.entity';
import { CourseSection } from '../teaching/entities/course-section.entity';
import { Schedule } from '../teaching/entities/schedule.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { EnrollmentDetail } from '../enrollments/entities/enrollment-detail.entity';
import { Grade } from '../assessments/entities/grade.entity';

import { SeedService } from './seed.service';
import { AdminSeeder } from './seeders/admin.seeder';
import { TeacherSeeder } from './seeders/teacher.seeder';
import { StudentSeeder } from './seeders/student.seeder';
import { AcademicYearSeeder } from './seeders/academic-year.seeder';
import { TermSeeder } from './seeders/term.seeder';
import { ClassroomSeeder } from './seeders/classroom.seeder';
import { LevelSeeder } from './seeders/level.seeder';
import { DegreeProgramSeeder } from './seeders/degree-program.seeder';
import { StudyPlanSeeder } from './seeders/study-plan.seeder';
import { CourseSeeder } from './seeders/course.seeder';
import { PrerequisiteSeeder } from './seeders/prerequisite.seeder';
import { CourseSectionSeeder } from './seeders/course-section.seeder';
import { ScheduleSeeder } from './seeders/schedule.seeder';
import { EnrollmentSeeder } from './seeders/enrollment.seeder';
import { EnrollmentDetailSeeder } from './seeders/enrollment-detail.seeder';
import { GradeSeeder } from './seeders/grade.seeder';

import { databaseConfig } from '../config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => databaseConfig(),
    }),
    TypeOrmModule.forFeature([
      User,
      Admin,
      Teacher,
      Student,
      AcademicYear,
      Term,
      Classroom,
      Level,
      DegreeProgram,
      StudyPlan,
      Course,
      Prerequisite,
      CourseSection,
      Schedule,
      Enrollment,
      EnrollmentDetail,
      Grade,
    ]),
  ],
  providers: [
    SeedService,
    AdminSeeder,
    TeacherSeeder,
    StudentSeeder,
    AcademicYearSeeder,
    TermSeeder,
    ClassroomSeeder,
    LevelSeeder,
    DegreeProgramSeeder,
    StudyPlanSeeder,
    CourseSeeder,
    PrerequisiteSeeder,
    CourseSectionSeeder,
    ScheduleSeeder,
    EnrollmentSeeder,
    EnrollmentDetailSeeder,
    GradeSeeder,
  ],
  exports: [SeedService],
})
export class SeedModule {}
