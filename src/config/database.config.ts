import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Student, Teacher, Admin } from '../auth/entities';
import { DegreeProgram, StudyPlan, Level, Course, Prerequisite } from '../programs/entities';
import { AcademicYear, Term } from '../calendar/entities';
import { Classroom } from '../facilities/entities';
import { CourseSection, Schedule } from '../teaching/entities';
import { Enrollment, EnrollmentDetail } from '../enrollments/entities';
import { Grade, AcademicProgress, CourseHistory } from '../assessments/entities';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'uagrm_inscripciones',
  entities: [
    User, Student, Teacher, Admin,
    DegreeProgram, StudyPlan, Level, Course, Prerequisite,
    AcademicYear, Term,
    Classroom,
    CourseSection, Schedule,
    Enrollment, EnrollmentDetail,
    Grade, AcademicProgress, CourseHistory,
  ],
  synchronize: true,
  logging: false, // Disable query logging
  dropSchema: false,
  migrationsRun: false,
});
