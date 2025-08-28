import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Student, Teacher, Admin } from '../auth/entities';
import { DegreeProgram, StudyPlan, Level, Course, Prerequisite } from '../programs/entities';
import { AcademicYear, Term } from '../calendar/entities';
import { Classroom } from '../facilities/entities';
import { CourseSection, Schedule } from '../teaching/entities';
import { Enrollment, EnrollmentDetail } from '../enrollments/entities';
import { Grade } from '../assessments/entities';

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
    Grade,
  ],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
  dropSchema: false,
  migrationsRun: false,
  // Configuración optimizada para transacciones y concurrencia
  extra: {
    // Pool de conexiones optimizado para alta concurrencia
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    acquire: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '30000', 10),
    idle: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
    // Configuraciones específicas de PostgreSQL para concurrencia
    statement_timeout: '5000', // 5 segundos max por query
    idle_in_transaction_session_timeout: '10000', // 10 segundos max idle en transacción
    lock_timeout: '3000', // 3 segundos max esperando locks
  },
});
