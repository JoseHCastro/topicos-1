import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyPlan } from '../../programs/entities/study-plan.entity';
import { DegreeProgram } from '../../programs/entities/degree-program.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class StudyPlanSeeder implements SeederInterface {
  private readonly logger = new Logger(StudyPlanSeeder.name);

  constructor(
    @InjectRepository(StudyPlan)
    private readonly studyPlanRepository: Repository<StudyPlan>,
    @InjectRepository(DegreeProgram)
    private readonly degreeProgramRepository: Repository<DegreeProgram>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding study plans...');

    const degreePrograms = await this.degreeProgramRepository.find();

    if (degreePrograms.length === 0) {
      this.logger.warn('No degree programs found, skipping study plans seeding');
      return;
    }

    const informaticaProgram = degreePrograms.find(dp => dp.code === '187-3');

    if (!informaticaProgram) {
      this.logger.warn('Ingeniería Informática program not found, skipping study plans seeding');
      return;
    }

    const studyPlans = [
      {
        degree_program_id: informaticaProgram.id,
        version: '2024-I',
        is_current: true,
        valid_from: new Date('2024-01-01'),
        valid_to: undefined,
        resolution: 'RES-187-2024-UAGRM',
      },
      {
        degree_program_id: informaticaProgram.id,
        version: '2020-I',
        is_current: false,
        valid_from: new Date('2020-01-01'),
        valid_to: new Date('2023-12-31'),
        resolution: 'RES-187-2020-UAGRM',
      },
    ];

    for (const studyPlanData of studyPlans) {
      const existingStudyPlan = await this.studyPlanRepository.findOne({
        where: {
          degree_program_id: studyPlanData.degree_program_id,
          version: studyPlanData.version,
        },
      });

      if (!existingStudyPlan) {
        const studyPlan = this.studyPlanRepository.create(studyPlanData);
        await this.studyPlanRepository.save(studyPlan);
        this.logger.log(`Created study plan: ${studyPlanData.version} (Current: ${studyPlanData.is_current})`);
      } else {
        this.logger.log(`Study plan already exists: ${studyPlanData.version}`);
      }
    }

    this.logger.log('Study plans seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing study plans...');
    await this.studyPlanRepository.createQueryBuilder().delete().execute();
    this.logger.log('Study plans cleared');
  }
}
