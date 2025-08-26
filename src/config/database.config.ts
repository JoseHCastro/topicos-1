import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Student, Professor, Admin } from '../auth/entities';
import { Level, Term } from '../catalogs/entities';
import { Career, StudyPlan, Subject, Prerequisite } from '../programs/entities';
import { Period, Management } from '../academic-calendar/entities';
import { Classroom, Schedule, SubjectGroup } from '../courses/entities';
import { Enrollment, EnrollmentDetail } from '../enrollments/entities';
import { Grade } from '../grades/entities';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'uagrm_inscripciones',
  entities: [
    User, Student, Professor, Admin,
    Level, Term,
    Career, StudyPlan, Subject, Prerequisite,
    Period, Management,
    Classroom, Schedule, SubjectGroup,
    Enrollment, EnrollmentDetail,
    Grade,
  ],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
  migrationsRun: false,
});
