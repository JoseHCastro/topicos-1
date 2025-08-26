import { Injectable, Logger } from '@nestjs/common';
import { UserSeeder } from './seeders/user.seeder';
import { AdminSeeder } from './seeders/admin.seeder';
import { ProfessorSeeder } from './seeders/professor.seeder';
import { StudentSeeder } from './seeders/student.seeder';
import { CareerSeeder } from './seeders/career.seeder';
import { LevelSeeder } from './seeders/level.seeder';
import { StudyPlanSeeder } from './seeders/study-plan.seeder';
import { SubjectSeeder } from './seeders/subject.seeder';
import { PrerequisiteSeeder } from './seeders/prerequisite.seeder';
import { ClassroomSeeder } from './seeders/classroom.seeder';
import { TermSeeder } from './seeders/term.seeder';
import { ManagementSeeder } from './seeders/management.seeder';
import { PeriodSeeder } from './seeders/period.seeder';
import { SubjectGroupSeeder } from './seeders/subject-group.seeder';
import { ScheduleSeeder } from './seeders/schedule.seeder';
import { EnrollmentSeeder } from './seeders/enrollment.seeder';
import { EnrollmentDetailSeeder } from './seeders/enrollment-detail.seeder';
import { GradeSeeder } from './seeders/grade.seeder';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly adminSeeder: AdminSeeder,
    private readonly professorSeeder: ProfessorSeeder,
    private readonly studentSeeder: StudentSeeder,
    private readonly careerSeeder: CareerSeeder,
    private readonly levelSeeder: LevelSeeder,
    private readonly studyPlanSeeder: StudyPlanSeeder,
    private readonly subjectSeeder: SubjectSeeder,
    private readonly prerequisiteSeeder: PrerequisiteSeeder,
    private readonly classroomSeeder: ClassroomSeeder,
    private readonly termSeeder: TermSeeder,
    private readonly managementSeeder: ManagementSeeder,
    private readonly periodSeeder: PeriodSeeder,
    private readonly subjectGroupSeeder: SubjectGroupSeeder,
    private readonly scheduleSeeder: ScheduleSeeder,
    private readonly enrollmentSeeder: EnrollmentSeeder,
    private readonly enrollmentDetailSeeder: EnrollmentDetailSeeder,
    private readonly gradeSeeder: GradeSeeder,
  ) {}

  async runAllSeeders(): Promise<void> {
    this.logger.log('🌱 Starting database seeding...');

    try {
      // Ejecutar seeders en orden específico (dependencias primero)
      
      // 1. Estructuras básicas
      await this.careerSeeder.run();
      await this.levelSeeder.run();
      await this.termSeeder.run();
      
      // 2. Estructura académica
      await this.studyPlanSeeder.run();
      await this.subjectSeeder.run();
      await this.prerequisiteSeeder.run(); // Después de subjects
      await this.classroomSeeder.run();
      
      // 3. Usuarios después de tener las estructuras básicas
      await this.userSeeder.run();
      await this.adminSeeder.run();
      await this.professorSeeder.run();
      await this.studentSeeder.run();

      // 4. Gestión académica
      await this.managementSeeder.run();
      await this.periodSeeder.run();
      
      // 5. Grupos de materias y horarios
      await this.subjectGroupSeeder.run();
      await this.scheduleSeeder.run();
      
      // 6. Inscripciones y notas
      await this.enrollmentSeeder.run();
      await this.enrollmentDetailSeeder.run();
      await this.gradeSeeder.run();

      this.logger.log('✅ Database seeding completed successfully!');
    } catch (error) {
      this.logger.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  async runSpecificSeeder(seederName: string): Promise<void> {
    this.logger.log(`🌱 Running ${seederName} seeder...`);

    try {
      switch (seederName.toLowerCase()) {
        case 'career':
          await this.careerSeeder.run();
          break;
        case 'level':
          await this.levelSeeder.run();
          break;
        case 'term':
          await this.termSeeder.run();
          break;
        case 'study-plan':
          await this.studyPlanSeeder.run();
          break;
        case 'subject':
          await this.subjectSeeder.run();
          break;
        case 'prerequisite':
          await this.prerequisiteSeeder.run();
          break;
        case 'classroom':
          await this.classroomSeeder.run();
          break;
        case 'user':
          await this.userSeeder.run();
          break;
        case 'admin':
          await this.adminSeeder.run();
          break;
        case 'professor':
          await this.professorSeeder.run();
          break;
        case 'student':
          await this.studentSeeder.run();
          break;
        case 'management':
          await this.managementSeeder.run();
          break;
        case 'period':
          await this.periodSeeder.run();
          break;
        case 'subject-group':
          await this.subjectGroupSeeder.run();
          break;
        case 'schedule':
          await this.scheduleSeeder.run();
          break;
        case 'enrollment':
          await this.enrollmentSeeder.run();
          break;
        case 'enrollment-detail':
          await this.enrollmentDetailSeeder.run();
          break;
        case 'grade':
          await this.gradeSeeder.run();
          break;
        default:
          throw new Error(`Seeder "${seederName}" not found`);
      }

      this.logger.log(`✅ ${seederName} seeder completed successfully!`);
    } catch (error) {
      this.logger.error(`❌ ${seederName} seeder failed:`, error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    this.logger.log('🗑️ Clearing database...');

    try {
      // Limpiar en orden inverso para mantener integridad referencial
      
      // 1. Limpiar notas e inscripciones primero
      await this.gradeSeeder.clear();
      await this.enrollmentDetailSeeder.clear();
      await this.enrollmentSeeder.clear();
      
      // 2. Limpiar horarios y grupos de materias
      await this.scheduleSeeder.clear();
      await this.subjectGroupSeeder.clear();
      
      // 3. Limpiar períodos y gestiones
      await this.periodSeeder.clear();
      await this.managementSeeder.clear();
      
      // 4. Limpiar usuarios
      await this.studentSeeder.clear();
      await this.professorSeeder.clear();
      await this.adminSeeder.clear();
      await this.userSeeder.clear();
      
      // 5. Limpiar estructura académica
      await this.prerequisiteSeeder.clear(); // Limpiar prerequisitos antes que subjects
      await this.subjectSeeder.clear();
      await this.studyPlanSeeder.clear();
      await this.classroomSeeder.clear();
      
      // 6. Limpiar estructuras básicas
      await this.termSeeder.clear();
      await this.levelSeeder.clear();
      await this.careerSeeder.clear();

      this.logger.log('✅ Database cleared successfully!');
    } catch (error) {
      this.logger.error('❌ Database clearing failed:', error);
      throw error;
    }
  }
}
