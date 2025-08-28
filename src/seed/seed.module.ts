import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { Admin } from '../auth/entities/admin.entity';
import { Teacher } from '../auth/entities/teacher.entity';
import { Student } from '../auth/entities/student.entity';
import { DegreeProgram } from '../programs/entities/degree-program.entity';
import { StudyPlan } from '../programs/entities/study-plan.entity';
import { Course } from '../programs/entities/course.entity';
import { Prerequisite } from '../programs/entities/prerequisite.entity';
import { Level } from '../programs/entities/level.entity';
import { Classroom } from '../facilities/entities/classroom.entity';
import { CourseSection } from '../teaching/entities/course-section.entity';
import { Schedule } from '../teaching/entities/schedule.entity';
import { AcademicYear } from '../calendar/entities/academic-year.entity';
import { Term } from '../calendar/entities/term.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { EnrollmentDetail } from '../enrollments/entities/enrollment-detail.entity';
import { Grade } from '../assessments/entities/grade.entity';
import { AcademicProgress } from '../assessments/entities/academic-progress.entity';
import { CourseHistory } from '../assessments/entities/course-history.entity';

import { SeedService } from './seed.service';
import { UserSeeder } from './seeders/user.seeder';
import { AdminSeeder } from './seeders/admin.seeder';
import { CareerSeeder } from './seeders/career.seeder';
import { LevelSeeder } from './seeders/level.seeder';
import { ClassroomSeeder } from './seeders/classroom.seeder';
import { TermSeeder } from './seeders/term.seeder';
import { ManagementSeeder } from './seeders/management.seeder';
import { PeriodSeeder } from './seeders/period.seeder';
import { EnrollmentSeeder } from './seeders/enrollment.seeder';
import { GradeSeeder } from './seeders/grade.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      Admin, 
      Teacher, 
      Student,
      DegreeProgram,
      StudyPlan,
      Course,
      Prerequisite,
      Level,
      Classroom,
      CourseSection,
      Schedule,
      AcademicYear,
      Term,
      Enrollment,
      EnrollmentDetail,
      Grade,
      AcademicProgress,
      CourseHistory,
    ])
  ],
  providers: [
    SeedService,
    UserSeeder,
    AdminSeeder,
    CareerSeeder,
    LevelSeeder,
    ClassroomSeeder,
    TermSeeder,
    ManagementSeeder,
    PeriodSeeder,
    EnrollmentSeeder,
    GradeSeeder,
  ],
  exports: [SeedService],
})
export class SeedModule {}
