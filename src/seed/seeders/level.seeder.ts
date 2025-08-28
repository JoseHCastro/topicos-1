import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from '../../programs/entities/level.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class LevelSeeder implements SeederInterface {
  private readonly logger = new Logger(LevelSeeder.name);

  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding levels...');

    const levels = [
      {
        name: 'Primer Semestre',
        order: 1,
      },
      {
        name: 'Segundo Semestre',
        order: 2,
      },
      {
        name: 'Tercer Semestre',
        order: 3,
      },
      {
        name: 'Cuarto Semestre',
        order: 4,
      },
      {
        name: 'Quinto Semestre',
        order: 5,
      },
      {
        name: 'Sexto Semestre',
        order: 6,
      },
      {
        name: 'Séptimo Semestre',
        order: 7,
      },
      {
        name: 'Octavo Semestre',
        order: 8,
      },
      {
        name: 'Noveno Semestre',
        order: 9,
      },
      {
        name: 'Décimo Semestre',
        order: 10,
      },
    ];

    for (const levelData of levels) {
      const existingLevel = await this.levelRepository.findOne({
        where: { order: levelData.order },
      });

      if (!existingLevel) {
        const level = this.levelRepository.create(levelData);
        await this.levelRepository.save(level);
        this.logger.log(`✅ Created level: ${levelData.name}`);
      } else {
        this.logger.log(`⚠️ Level already exists: ${levelData.name}`);
      }
    }

    this.logger.log('✅ Levels seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing levels...');
    await this.levelRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Levels cleared');
  }
}
