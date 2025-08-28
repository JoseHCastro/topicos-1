import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
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

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly adminSeeder: AdminSeeder,
    private readonly teacherSeeder: TeacherSeeder,
    private readonly studentSeeder: StudentSeeder,
    private readonly academicYearSeeder: AcademicYearSeeder,
    private readonly termSeeder: TermSeeder,
    private readonly classroomSeeder: ClassroomSeeder,
    private readonly levelSeeder: LevelSeeder,
    private readonly degreeProgramSeeder: DegreeProgramSeeder,
    private readonly studyPlanSeeder: StudyPlanSeeder,
    private readonly courseSeeder: CourseSeeder,
    private readonly prerequisiteSeeder: PrerequisiteSeeder,
    private readonly courseSectionSeeder: CourseSectionSeeder,
    private readonly scheduleSeeder: ScheduleSeeder,
    private readonly enrollmentSeeder: EnrollmentSeeder,
    private readonly enrollmentDetailSeeder: EnrollmentDetailSeeder,
    private readonly gradeSeeder: GradeSeeder,
  ) {}

  async runAllSeeders(): Promise<void> {
    this.logger.log('Starting database seeding...');

    // Order is important due to foreign key constraints
    const seeders = [
      this.adminSeeder,
      this.teacherSeeder,
      this.studentSeeder,
      this.academicYearSeeder,
      this.termSeeder,
      this.classroomSeeder,
      this.levelSeeder,
      this.degreeProgramSeeder,
      this.studyPlanSeeder,
      this.courseSeeder,
      this.prerequisiteSeeder,
      this.courseSectionSeeder,
      this.scheduleSeeder,
      this.enrollmentSeeder,
      this.enrollmentDetailSeeder,
      this.gradeSeeder,
    ];

    for (const seeder of seeders) {
      try {
        await seeder.run();
      } catch (error) {
        this.logger.error(`Database seeding failed:`, error);
        throw error;
      }
    }

    this.logger.log('✅ Database seeding completed successfully!');
  }

  async clearAllData(): Promise<void> {
    this.logger.log('🧹 Clearing database...');

    try {
      // For PostgreSQL - disable constraints temporarily
      await this.dataSource.query('SET session_replication_role = replica;');
      
      // Get all table names from the current database schema
      const tables = await this.dataSource.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);

      // Truncate all tables with CASCADE to handle foreign keys
      for (const table of tables) {
        await this.dataSource.query(`TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE;`);
        this.logger.log(`✅ Cleared table: ${table.tablename}`);
      }

      // Re-enable constraints
      await this.dataSource.query('SET session_replication_role = DEFAULT;');

      this.logger.log('✅ Database cleared successfully!');
    } catch (error) {
      this.logger.error('❌ Error clearing database:', error.message);
      
      // Fallback: Try clearing tables individually in reverse dependency order
      this.logger.log('🔄 Attempting fallback clearing method...');
      
      const seeders = [
        this.gradeSeeder,
        this.enrollmentDetailSeeder,
        this.enrollmentSeeder,
        this.scheduleSeeder,
        this.courseSectionSeeder,
        this.prerequisiteSeeder,
        this.courseSeeder,
        this.studyPlanSeeder,
        this.degreeProgramSeeder,
        this.levelSeeder,
        this.classroomSeeder,
        this.termSeeder,
        this.academicYearSeeder,
        this.studentSeeder,
        this.teacherSeeder,
        this.adminSeeder,
      ];

      for (const seeder of seeders) {
        try {
          if (seeder.clear) {
            await seeder.clear();
          }
        } catch (error) {
          this.logger.warn(`⚠️ Clearing failed for ${seeder.constructor.name}:`, error.message);
          // Continue with other seeders even if one fails
        }
      }

      this.logger.log('✅ Fallback database clearing completed!');
    }
  }
}
