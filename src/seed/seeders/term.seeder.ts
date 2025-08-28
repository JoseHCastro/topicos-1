import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from '../../calendar/entities/term.entity';
import { AcademicYear } from '../../calendar/entities/academic-year.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class TermSeeder implements SeederInterface {
  private readonly logger = new Logger(TermSeeder.name);

  constructor(
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding academic years and terms...');

    // Primero crear años académicos
    const academicYears = [
      {
        year: 2023,
        name: 'AY 2023',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
      },
      {
        year: 2024,
        name: 'AY 2024',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
      },
      {
        year: 2025,
        name: 'AY 2025',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
      },
    ];

    const createdAcademicYears: AcademicYear[] = [];

    for (const yearData of academicYears) {
      let existingYear = await this.academicYearRepository.findOne({
        where: { year: yearData.year },
      });

      if (!existingYear) {
        existingYear = this.academicYearRepository.create(yearData);
        await this.academicYearRepository.save(existingYear);
        this.logger.log(`✅ Created academic year: ${yearData.name}`);
      } else {
        this.logger.log(`⚠️ Academic year already exists: ${yearData.name}`);
      }

      createdAcademicYears.push(existingYear);
    }

    // Ahora crear términos para cada año académico
    const termsData = [
      {
        academic_year: 2023,
        name: '2023-I',
        start_date: new Date('2023-02-01'),
        end_date: new Date('2023-06-30'),
        status: 'completed',
      },
      {
        academic_year: 2023,
        name: '2023-II',
        start_date: new Date('2023-08-01'),
        end_date: new Date('2023-12-15'),
        status: 'completed',
      },
      {
        academic_year: 2024,
        name: '2024-I',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-06-30'),
        status: 'completed',
      },
      {
        academic_year: 2024,
        name: '2024-II',
        start_date: new Date('2024-08-01'),
        end_date: new Date('2024-12-15'),
        status: 'completed',
      },
      {
        academic_year: 2025,
        name: '2025-I',
        start_date: new Date('2025-02-01'),
        end_date: new Date('2025-06-30'),
        status: 'active',
      },
      {
        academic_year: 2025,
        name: '2025-II',
        start_date: new Date('2025-08-01'),
        end_date: new Date('2025-12-15'),
        status: 'planned',
      },
    ];

    for (const termData of termsData) {
      const academicYear = createdAcademicYears.find(ay => ay.year === termData.academic_year);
      
      if (!academicYear) {
        this.logger.error(`❌ Academic year ${termData.academic_year} not found`);
        continue;
      }

      const existingTerm = await this.termRepository.findOne({
        where: { 
          name: termData.name,
          academic_year_id: academicYear.id
        },
      });

      if (!existingTerm) {
        const term = this.termRepository.create({
          name: termData.name,
          start_date: termData.start_date,
          end_date: termData.end_date,
          status: termData.status,
          academic_year_id: academicYear.id,
        });
        await this.termRepository.save(term);
        this.logger.log(`✅ Created term: ${termData.name}`);
      } else {
        this.logger.log(`⚠️ Term already exists: ${termData.name}`);
      }
    }

    this.logger.log('✅ Academic years and terms seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing terms...');
    await this.termRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Terms cleared');
  }
}
