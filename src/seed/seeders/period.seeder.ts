import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Term, AcademicYear } from '../../calendar/entities';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class PeriodSeeder implements SeederInterface {
  private readonly logger = new Logger(PeriodSeeder.name);

  constructor(
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding terms...');

    // Obtener los años académicos existentes
    const academicYears = await this.academicYearRepository.find();

    if (academicYears.length === 0) {
      this.logger.warn('⚠️ No academic years found, skipping terms seeding');
      return;
    }

    for (const academicYear of academicYears) {
      // Primer período del año
      const firstTerm = {
        academic_year_id: academicYear.id,
        name: `${academicYear.year}-I`,
        start_date: new Date(`${academicYear.year}-02-01`),
        end_date: new Date(`${academicYear.year}-06-30`),
        status: academicYear.year === 2024 ? 'active' : 
                academicYear.year > 2024 ? 'planned' : 'completed',
      };

      // Segundo período del año
      const secondTerm = {
        academic_year_id: academicYear.id,
        name: `${academicYear.year}-II`,
        start_date: new Date(`${academicYear.year}-08-01`),
        end_date: new Date(`${academicYear.year}-12-15`),
        status: academicYear.year === 2024 ? 'planned' : 
                academicYear.year > 2024 ? 'planned' : 'completed',
      };

      const terms = [firstTerm, secondTerm];

      for (const termData of terms) {
        const existingTerm = await this.termRepository.findOne({
          where: { 
            academic_year_id: termData.academic_year_id, 
            name: termData.name 
          },
        });

        if (!existingTerm) {
          const term = this.termRepository.create(termData);
          await this.termRepository.save(term);
          this.logger.log(`✅ Created term: ${termData.name}`);
        } else {
          this.logger.log(`⚠️ Term already exists: ${termData.name}`);
        }
      }
    }

    this.logger.log('✅ Terms seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing terms...');
    await this.termRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Terms cleared');
  }
}
