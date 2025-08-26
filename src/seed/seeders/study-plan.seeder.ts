import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyPlan } from '../../programs/entities/study-plan.entity';
import { Career } from '../../programs/entities/career.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class StudyPlanSeeder implements SeederInterface {
  private readonly logger = new Logger(StudyPlanSeeder.name);

  constructor(
    @InjectRepository(StudyPlan)
    private readonly studyPlanRepository: Repository<StudyPlan>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding study plans...');

    // Obtener las carreras creadas
    const ingenieriaInformatica = await this.careerRepository.findOne({
      where: { codigo_carrera: '187-3' },
    });
    const ingenieriaSistemas = await this.careerRepository.findOne({
      where: { codigo_carrera: '188-4' },
    });

    if (!ingenieriaInformatica || !ingenieriaSistemas) {
      this.logger.error('❌ Careers not found. Run career seeder first.');
      return;
    }

    const studyPlans = [
      {
        id_carrera: ingenieriaInformatica.id_carrera,
        version: '2024-1',
        año_aprobacion: 2024,
        creditos_totales: 240,
        fecha_inicio_vigencia: new Date('2024-01-01'),
        fecha_fin_vigencia: new Date('2029-12-31'),
        estado: 'vigente',
      },
      {
        id_carrera: ingenieriaSistemas.id_carrera,
        version: '2024-1',
        año_aprobacion: 2024,
        creditos_totales: 235,
        fecha_inicio_vigencia: new Date('2024-01-01'),
        fecha_fin_vigencia: new Date('2029-12-31'),
        estado: 'vigente',
      },      
    ];

    for (const studyPlanData of studyPlans) {
      const existingPlan = await this.studyPlanRepository.findOne({
        where: {
          id_carrera: studyPlanData.id_carrera,
          version: studyPlanData.version,
        },
      });

      if (!existingPlan) {
        const studyPlan = this.studyPlanRepository.create(studyPlanData);
        await this.studyPlanRepository.save(studyPlan);
        this.logger.log(`✅ Created study plan: Version ${studyPlanData.version} for career ID ${studyPlanData.id_carrera}`);
      } else {
        this.logger.log(`⚠️ Study plan already exists: Version ${studyPlanData.version}`);
      }
    }

    this.logger.log('✅ Study plans seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing study plans...');
    await this.studyPlanRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Study plans cleared');
  }
}
