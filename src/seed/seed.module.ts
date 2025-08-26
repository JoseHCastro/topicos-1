import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { Admin } from '../auth/entities/admin.entity';
import { Professor } from '../auth/entities/professor.entity';
import { Student } from '../auth/entities/student.entity';
import { Career } from '../programs/entities/career.entity';
import { StudyPlan } from '../programs/entities/study-plan.entity';
import { Subject } from '../programs/entities/subject.entity';
import { Prerequisite } from '../programs/entities/prerequisite.entity';
import { Level } from '../catalogs/entities/level.entity';
import { Term } from '../catalogs/entities/term.entity';
import { Classroom } from '../courses/entities/classroom.entity';
import { SubjectGroup } from '../courses/entities/subject-group.entity';
import { Schedule } from '../courses/entities/schedule.entity';
import { Management } from '../academic-calendar/entities/management.entity';
import { Period } from '../academic-calendar/entities/period.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { EnrollmentDetail } from '../enrollments/entities/enrollment-detail.entity';
import { Grade } from '../grades/entities/grade.entity';

import { SeedService } from './seed.service';
import { UserSeeder } from './seeders/user.seeder';
import { AdminSeeder } from './seeders/admin.seeder';
import { ProfessorSeeder } from './seeders/professor.seeder';
import { StudentSeeder } from './seeders/student.seeder';
import { CareerSeeder } from './seeders/career.seeder';
import { LevelSeeder } from './seeders/level.seeder';
import { TermSeeder } from './seeders/term.seeder';
import { StudyPlanSeeder } from './seeders/study-plan.seeder';
import { SubjectSeeder } from './seeders/subject.seeder';
import { PrerequisiteSeeder } from './seeders/prerequisite.seeder';
import { ClassroomSeeder } from './seeders/classroom.seeder';
import { ManagementSeeder } from './seeders/management.seeder';
import { PeriodSeeder } from './seeders/period.seeder';
import { SubjectGroupSeeder } from './seeders/subject-group.seeder';
import { ScheduleSeeder } from './seeders/schedule.seeder';
import { EnrollmentSeeder } from './seeders/enrollment.seeder';
import { EnrollmentDetailSeeder } from './seeders/enrollment-detail.seeder';
import { GradeSeeder } from './seeders/grade.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      Admin, 
      Professor, 
      Student,
      Career,
      StudyPlan,
      Subject,
      Prerequisite,
      Level,
      Term,
      Classroom,
      SubjectGroup,
      Schedule,
      Management,
      Period,
      Enrollment,
      EnrollmentDetail,
      Grade,
    ])
  ],
  providers: [
    SeedService,
    UserSeeder,
    AdminSeeder,
    ProfessorSeeder,
    StudentSeeder,
    CareerSeeder,
    LevelSeeder,
    TermSeeder,
    StudyPlanSeeder,
    SubjectSeeder,
    PrerequisiteSeeder,
    ClassroomSeeder,
    ManagementSeeder,
    PeriodSeeder,
    SubjectGroupSeeder,
    ScheduleSeeder,
    EnrollmentSeeder,
    EnrollmentDetailSeeder,
    GradeSeeder,
  ],
  exports: [SeedService],
})
export class SeedModule {}
