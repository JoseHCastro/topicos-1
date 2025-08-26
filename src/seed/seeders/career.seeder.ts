import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Career } from '../../programs/entities/career.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class CareerSeeder implements SeederInterface {
  private readonly logger = new Logger(CareerSeeder.name);

  constructor(
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding careers...');

    const careers = [
      {
        codigo_carrera: '187-3',
        nombre_carrera: 'Ingeniería Informática',
        descripcion: 'Carrera orientada al desarrollo de software, sistemas de información y tecnologías de la información.',
        duracion_semestres: 10,
        titulo_otorgado: 'Ingeniero Informático',
        modalidad: 'presencial',
        estado: 'activa',
      },
      {
        codigo_carrera: '188-4',
        nombre_carrera: 'Ingeniería en Sistemas',
        descripcion: 'Carrera enfocada en el análisis, diseño e implementación de sistemas computacionales complejos.',
        duracion_semestres: 10,
        titulo_otorgado: 'Ingeniero en Sistemas',
        modalidad: 'presencial',
        estado: 'activa',
      },      
    ];

    for (const careerData of careers) {
      const existingCareer = await this.careerRepository.findOne({
        where: { codigo_carrera: careerData.codigo_carrera },
      });

      if (!existingCareer) {
        const career = this.careerRepository.create(careerData);
        await this.careerRepository.save(career);
        this.logger.log(`✅ Created career: ${careerData.nombre_carrera} (${careerData.codigo_carrera})`);
      } else {
        this.logger.log(`⚠️ Career already exists: ${careerData.codigo_carrera}`);
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
