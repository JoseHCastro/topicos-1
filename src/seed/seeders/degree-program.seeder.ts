import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DegreeProgram } from '../../programs/entities/degree-program.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class DegreeProgramSeeder implements SeederInterface {
  private readonly logger = new Logger(DegreeProgramSeeder.name);

  constructor(
    @InjectRepository(DegreeProgram)
    private readonly degreeProgramRepository: Repository<DegreeProgram>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding degree programs...');

    const degreePrograms = [
      {
        name: 'Ingeniería Informática',
        code: '187-3',
        degree_title: 'Ingeniero Informático',
        modality: 'Presencial',
        status: 'Active',
      },
    ];

    for (const degreeProgramData of degreePrograms) {
      const existingDegreeProgram = await this.degreeProgramRepository.findOne({
        where: { code: degreeProgramData.code },
      });

      if (!existingDegreeProgram) {
        const degreeProgram =
          this.degreeProgramRepository.create(degreeProgramData);
        await this.degreeProgramRepository.save(degreeProgram);
        this.logger.log(
          `Created degree program: ${degreeProgramData.name} (${degreeProgramData.code})`,
        );
      } else {
        this.logger.log(
          `Degree program already exists: ${degreeProgramData.code}`,
        );
      }
    }

    this.logger.log('Degree programs seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing degree programs...');
    await this.degreeProgramRepository.createQueryBuilder().delete().execute();
    this.logger.log('Degree programs cleared');
  }
}
