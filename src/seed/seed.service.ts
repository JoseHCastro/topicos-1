import { Injectable, Logger } from '@nestjs/common';
import { UserSeeder } from './seeders/user.seeder';
import { AdminSeeder } from './seeders/admin.seeder';
import { ProfessorSeeder } from './seeders/professor.seeder';
import { StudentSeeder } from './seeders/student.seeder';


@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly adminSeeder: AdminSeeder,
    private readonly professorSeeder: ProfessorSeeder,
    private readonly studentSeeder: StudentSeeder,
  ) {}

  async runAllSeeders(): Promise<void> {
    this.logger.log('🌱 Starting database seeding...');

    try {
      // Ejecutar seeders en orden específico
      await this.userSeeder.run();
      await this.adminSeeder.run();
      await this.professorSeeder.run();
      await this.studentSeeder.run();

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
      await this.studentSeeder.clear();
      await this.professorSeeder.clear();
      await this.adminSeeder.clear();
      await this.userSeeder.clear();

      this.logger.log('✅ Database cleared successfully!');
    } catch (error) {
      this.logger.error('❌ Database clearing failed:', error);
      throw error;
    }
  }
}
