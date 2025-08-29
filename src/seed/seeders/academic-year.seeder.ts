import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../../calendar/entities/academic-year.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class AcademicYearSeeder implements SeederInterface {
  private readonly logger = new Logger(AcademicYearSeeder.name);

  constructor(
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding academic years...');

    const academicYears = [
      {
        year: 2023,
        name: 'Gestión Académica 2023',
        start_date: new Date('2023-02-01'),
        end_date: new Date('2023-12-15'),
        is_current: false,
      },
      {
        year: 2024,
        name: 'Gestión Académica 2024',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-12-15'),
        is_current: false,
      },
      {
        year: 2025,
        name: 'Gestión Académica 2025',
        start_date: new Date('2025-02-01'),
        end_date: new Date('2025-12-15'),
        is_current: true,
      },
    ];

    for (const academicYearData of academicYears) {
      const existingYear = await this.academicYearRepository.findOne({
        where: { year: academicYearData.year },
      });

      if (!existingYear) {
        const academicYear = this.academicYearRepository.create(academicYearData);
        await this.academicYearRepository.save(academicYear);
        this.logger.log(`Created academic year: ${academicYearData.year}`);
      } else {
        this.logger.log(`Academic year already exists: ${academicYearData.year}`);
      }
    }

    this.logger.log('Academic years seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing academic years...');
    await this.academicYearRepository.createQueryBuilder().delete().execute();
    this.logger.log('Academic years cleared');
  }
}
