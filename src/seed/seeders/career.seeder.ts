import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DegreeProgram } from '../../programs/entities/degree-program.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class CareerSeeder implements SeederInterface {
  private readonly logger = new Logger(CareerSeeder.name);

  constructor(
    @InjectRepository(DegreeProgram)
    private readonly careerRepository: Repository<DegreeProgram>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding careers...');

    const careers = [
      {
        code: '187-3',
        name: 'Ingeniería Informática',
        degree_title: 'Ingeniero Informático',
        modality: 'presencial',
        status: 'active',
      },
      {
        code: '188-4',
        name: 'Ingeniería en Sistemas',
        degree_title: 'Ingeniero en Sistemas',
        modality: 'presencial',
        status: 'active',
      },      
    ];

    for (const careerData of careers) {
      const existingCareer = await this.careerRepository.findOne({
        where: { code: careerData.code },
      });

      if (!existingCareer) {
        const career = this.careerRepository.create(careerData);
        await this.careerRepository.save(career);
        this.logger.log(`✅ Created career: ${careerData.name} (${careerData.code})`);
      } else {
        this.logger.log(`⚠️ Career already exists: ${careerData.code}`);
      }
    }

    this.logger.log('✅ Careers seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing careers...');
    await this.careerRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Careers cleared');
  }
}
