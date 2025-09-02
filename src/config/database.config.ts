import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Student, Teacher, Admin } from '../auth/entities';
import {
  DegreeProgram,
  StudyPlan,
  Level,
  Course,
  Prerequisite,
} from '../programs/entities';
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
    User,
    Student,
    Teacher,
    Admin,
    DegreeProgram,
    StudyPlan,
    Level,
    Course,
    Prerequisite,
    AcademicYear,
    Term,
    Classroom,
    CourseSection,
    Schedule,
    Enrollment,
    EnrollmentDetail,
    Grade,
  ],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
  dropSchema: false,
  migrationsRun: false,
  extra: {
    // Connection Pool optimizado para Resource Management (Fase 5.1)
    max: parseInt(process.env.WORKER_DB_POOL_MAX || '5', 10), // Máximo 5 conexiones según spec
    min: parseInt(process.env.WORKER_DB_POOL_MIN || '1', 10), // Mínimo 1 conexión
    acquire: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '10000', 10), // 10s según spec
    idle: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30s para cleanup

    // Timeouts de conexión según especificación
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || '10000',
      10,
    ), // 10s
    statement_timeout: '5000',
    idle_in_transaction_session_timeout: '10000',
    lock_timeout: '3000',

    // Configuraciones adicionales para estabilidad
    createTimeoutMillis: 5000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 10000, // Cleanup cada 10s
    createRetryIntervalMillis: 200,

    // Validación de conexiones para workers
    testOnBorrow: true,
    testOnReturn: false,
    testWhileIdle: true,

    // Performance tuning
    evictionRunIntervalMillis: 30000,
    softIdleTimeoutMillis: 60000,
    numTestsPerEvictionRun: 3,
  },
});
