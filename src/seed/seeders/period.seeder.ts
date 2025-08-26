import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Period } from '../../academic-calendar/entities/period.entity';
import { Management } from '../../academic-calendar/entities/management.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class PeriodSeeder implements SeederInterface {
  private readonly logger = new Logger(PeriodSeeder.name);

  constructor(
    @InjectRepository(Period)
    private readonly periodRepository: Repository<Period>,
    @InjectRepository(Management)
    private readonly managementRepository: Repository<Management>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding periods...');

    // Obtener las gestiones existentes
    const managements = await this.managementRepository.find();

    if (managements.length === 0) {
      this.logger.warn('⚠️ No managements found, skipping periods seeding');
      return;
    }

    for (const management of managements) {
      // Primer período del año
      const firstPeriod = {
        id_gestion: management.id_gestion,
        numero_periodo: 1,
        nombre_periodo: 'Primer Semestre',
        fecha_inicio: new Date(`${management.año}-02-01`),
        fecha_fin: new Date(`${management.año}-06-30`),
        fecha_inicio_inscripciones: new Date(`${management.año}-01-15`),
        fecha_fin_inscripciones: new Date(`${management.año}-01-31`),
        estado: management.año === 2024 ? 'activo' as const : 
                management.año > 2024 ? 'planificado' as const : 'finalizado' as const,
      };

      // Segundo período del año
      const secondPeriod = {
        id_gestion: management.id_gestion,
        numero_periodo: 2,
        nombre_periodo: 'Segundo Semestre',
        fecha_inicio: new Date(`${management.año}-08-01`),
        fecha_fin: new Date(`${management.año}-12-15`),
        fecha_inicio_inscripciones: new Date(`${management.año}-07-15`),
        fecha_fin_inscripciones: new Date(`${management.año}-07-31`),
        estado: management.año === 2024 ? 'planificado' as const : 
                management.año > 2024 ? 'planificado' as const : 'finalizado' as const,
      };

      const periods = [firstPeriod, secondPeriod];

      for (const periodData of periods) {
        const existingPeriod = await this.periodRepository.findOne({
          where: { 
            id_gestion: periodData.id_gestion, 
            numero_periodo: periodData.numero_periodo 
          },
        });

        if (!existingPeriod) {
          const period = this.periodRepository.create(periodData);
          await this.periodRepository.save(period);
          this.logger.log(`✅ Created period: ${management.año} - ${periodData.nombre_periodo}`);
        } else {
          this.logger.log(`⚠️ Period already exists: ${management.año} - ${periodData.nombre_periodo}`);
        }
      }
    }

    this.logger.log('✅ Periods seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing periods...');
    await this.periodRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Periods cleared');
  }
}
