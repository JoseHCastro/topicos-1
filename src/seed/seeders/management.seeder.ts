import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AcademicYear } from '../../calendar/entities';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class ManagementSeeder implements SeederInterface {
  private readonly logger = new Logger(ManagementSeeder.name);

  constructor(
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
  ) {}

  async run(): Promise<void> {
    this.logger.log(' Seeding academic years...');

    const academicYears = [
      {
        year: 2025,
        name: 'AY 2025',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
      },
      {
        year: 2024,
        name: 'AY 2024',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
      },
      {
        year: 2023,
        name: 'AY 2023',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
      },
      {
        year: 2022,
        name: 'AY 2022',
        start_date: new Date('2022-01-01'),
        end_date: new Date('2022-12-31'),
      },
    ];

    for (const academicYearData of academicYears) {
      const existingAcademicYear = await this.academicYearRepository.findOne({
        where: { year: academicYearData.year },
      });

      if (!existingAcademicYear) {
        const academicYear = this.academicYearRepository.create(academicYearData);
        await this.academicYearRepository.save(academicYear);
        this.logger.log(` Created academic year: ${academicYearData.name}`);
      } else {
        this.logger.log(` Academic year already exists: ${academicYearData.name}`);
      }
    }

    this.logger.log(' Academic years seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log(' Clearing academic years...');
    await this.academicYearRepository.createQueryBuilder().delete().execute();
    this.logger.log(' Academic years cleared');
  }
}
