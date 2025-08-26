import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Management } from '../../academic-calendar/entities/management.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class ManagementSeeder implements SeederInterface {
  private readonly logger = new Logger(ManagementSeeder.name);

  constructor(
    @InjectRepository(Management)
    private readonly managementRepository: Repository<Management>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding managements...');

    const managements = [
      {
        año: 2025,
        descripcion: 'Gestión Académica 2025',
        fecha_inicio: new Date('2025-01-01'),
        fecha_fin: new Date('2025-12-31'),
        estado: 'planificada' as const,
      },
      {
        año: 2024,
        descripcion: 'Gestión Académica 2024',
        fecha_inicio: new Date('2024-01-01'),
        fecha_fin: new Date('2024-12-31'),
        estado: 'activa' as const,
      },
      {
        año: 2023,
        descripcion: 'Gestión Académica 2023',
        fecha_inicio: new Date('2023-01-01'),
        fecha_fin: new Date('2023-12-31'),
        estado: 'finalizada' as const,
      },
      {
        año: 2022,
        descripcion: 'Gestión Académica 2022',
        fecha_inicio: new Date('2022-01-01'),
        fecha_fin: new Date('2022-12-31'),
        estado: 'finalizada' as const,
      },
    ];

    for (const managementData of managements) {
      const existingManagement = await this.managementRepository.findOne({
        where: { año: managementData.año },
      });

      if (!existingManagement) {
        const management = this.managementRepository.create(managementData);
        await this.managementRepository.save(management);
        this.logger.log(`✅ Created management: ${managementData.descripcion}`);
      } else {
        this.logger.log(`⚠️ Management already exists: ${managementData.descripcion}`);
      }
    }

    this.logger.log('✅ Managements seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing managements...');
    await this.managementRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Managements cleared');
  }
}
