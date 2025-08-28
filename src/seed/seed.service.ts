import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly adminSeeder: AdminSeeder,
    private readonly careerSeeder: CareerSeeder,
    private readonly levelSeeder: LevelSeeder,
    private readonly classroomSeeder: ClassroomSeeder,
    private readonly termSeeder: TermSeeder,
    private readonly managementSeeder: ManagementSeeder,
    private readonly periodSeeder: PeriodSeeder,
    private readonly enrollmentSeeder: EnrollmentSeeder,
    private readonly gradeSeeder: GradeSeeder,
  ) {}

  async runAllSeeders(): Promise<void> {
    this.logger.log('Starting database seeding...');

    try {
      // Ejecutar seeders en orden específico (dependencias primero)
      
      // 1. Estructuras básicas
      await this.careerSeeder.run();
      await this.levelSeeder.run();
      await this.termSeeder.run();
      
      // 2. Estructura académica y física
      await this.classroomSeeder.run();
      
      // 3. Usuarios después de tener las estructuras básicas
      await this.userSeeder.run();
      await this.adminSeeder.run();

      // 4. Gestión académica
      await this.managementSeeder.run();
      await this.periodSeeder.run();
      
      // 5. Inscripciones y notas
      await this.enrollmentSeeder.run();
      await this.gradeSeeder.run();

      this.logger.log('Database seeding completed successfully!');
    } catch (error) {
      this.logger.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  async runSpecificSeeder(seederName: string): Promise<void> {
    this.logger.log(`Running ${seederName} seeder...`);

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
        case 'classroom':
          await this.classroomSeeder.run();
          break;
        case 'user':
          await this.userSeeder.run();
          break;
        case 'admin':
          await this.adminSeeder.run();
          break;
        case 'management':
          await this.managementSeeder.run();
          break;
        case 'period':
          await this.periodSeeder.run();
          break;
        case 'enrollment':
          await this.enrollmentSeeder.run();
          break;
        case 'grade':
          await this.gradeSeeder.run();
          break;
        default:
          throw new Error(`Seeder "${seederName}" not found`);
      }

      this.logger.log(`${seederName} seeder completed successfully!`);
    } catch (error) {
      this.logger.error(`❌ ${seederName} seeder failed:`, error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    this.logger.log('Clearing database...');

    try {
      // Limpiar en orden inverso para mantener integridad referencial
      
      // 1. Limpiar notas e inscripciones primero
      await this.gradeSeeder.clear();
      await this.enrollmentSeeder.clear();
      
      // 2. Limpiar períodos y gestiones
      await this.periodSeeder.clear();
      await this.managementSeeder.clear();
      
      // 3. Limpiar usuarios
      await this.adminSeeder.clear();
      await this.userSeeder.clear();
      
      // 4. Limpiar estructura académica
      await this.classroomSeeder.clear();
      
      // 5. Limpiar estructuras básicas
      await this.termSeeder.clear();
      await this.levelSeeder.clear();
      await this.careerSeeder.clear();

      this.logger.log('Database cleared successfully!');
    } catch (error) {
      this.logger.error('❌ Database clearing failed:', error);
      throw error;
    }
  }
}
