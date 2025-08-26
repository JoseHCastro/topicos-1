import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from '../../catalogs/entities';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class TermSeeder implements SeederInterface {
  private readonly logger = new Logger(TermSeeder.name);

  constructor(
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding terms...');

    const terms = [
      {
        year: '2025',
        number: 1,
        name: '1er Sem 2025',
        isActive: true,
      },
      {
        year: '2025',
        number: 2,
        name: '2do Sem 2025',
        isActive: true,
      },
      {
        year: '2024',
        number: 1,
        name: '1er Sem 2024',
        isActive: false,
      },
      {
        year: '2024',
        number: 2,
        name: '2do Sem 2024',
        isActive: false,
      },
      {
        year: '2023',
        number: 1,
        name: '1er Sem 2023',
        isActive: false,
      },
      {
        year: '2023',
        number: 2,
        name: '2do Sem 2023',
        isActive: false,
      },
    ];

    for (const termData of terms) {
      const existingTerm = await this.termRepository.findOne({
        where: { year: termData.year, number: termData.number },
      });

      if (!existingTerm) {
        const term = this.termRepository.create(termData);
        await this.termRepository.save(term);
        this.logger.log(`✅ Created term: ${termData.name}`);
      } else {
        this.logger.log(`⚠️ Term already exists: ${termData.name}`);
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
