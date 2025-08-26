import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from '../../catalogs/entities/level.entity';
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
        numero_nivel: 1,
        nombre_nivel: 'Primer Semestre',
        descripcion: 'Materias introductorias y fundamentales para la carrera',
      },
      {
        numero_nivel: 2,
        nombre_nivel: 'Segundo Semestre',
        descripcion: 'Continuación de materias básicas con mayor profundidad',
      },
      {
        numero_nivel: 3,
        nombre_nivel: 'Tercer Semestre',
        descripcion: 'Materias intermedias que consolidan conocimientos básicos',
      },
      {
        numero_nivel: 4,
        nombre_nivel: 'Cuarto Semestre',
        descripcion: 'Materias especializadas del área de informática',
      },
      {
        numero_nivel: 5,
        nombre_nivel: 'Quinto Semestre',
        descripcion: 'Materias avanzadas con enfoque práctico',
      },
      {
        numero_nivel: 6,
        nombre_nivel: 'Sexto Semestre',
        descripcion: 'Materias de especialización y proyectos aplicados',
      },
      {
        numero_nivel: 7,
        nombre_nivel: 'Séptimo Semestre',
        descripcion: 'Materias avanzadas de la especialización elegida',
      },
      {
        numero_nivel: 8,
        nombre_nivel: 'Octavo Semestre',
        descripcion: 'Materias de profundización y desarrollo de proyectos',
      },
      {
        numero_nivel: 9,
        nombre_nivel: 'Noveno Semestre',
        descripcion: 'Trabajo de grado y materias electivas',
      },
      {
        numero_nivel: 10,
        nombre_nivel: 'Décimo Semestre',
        descripcion: 'Finalización del trabajo de grado y modalidad de graduación',
      },
    ];

    for (const levelData of levels) {
      const existingLevel = await this.levelRepository.findOne({
        where: { numero_nivel: levelData.numero_nivel },
      });

      if (!existingLevel) {
        const level = this.levelRepository.create(levelData);
        await this.levelRepository.save(level);
        this.logger.log(`✅ Created level: ${levelData.nombre_nivel}`);
      } else {
        this.logger.log(`⚠️ Level already exists: ${levelData.nombre_nivel}`);
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
