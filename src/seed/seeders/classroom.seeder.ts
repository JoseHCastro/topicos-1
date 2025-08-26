import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from '../../courses/entities/classroom.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class ClassroomSeeder implements SeederInterface {
  private readonly logger = new Logger(ClassroomSeeder.name);

  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding classrooms...');

    const classrooms = [
      // Edificio FICO - Aulas tradicionales
      {
        codigo_aula: 'FICO-101',
        nombre_aula: 'Salon Auditorio',
        capacidad: 120,
        edificio: 'Facultad Integral del Chaco',
        piso: 4,
        tipo_aula: 'tradicional',
        equipamiento: 'Proyector, sistema de audio, pizarra digital, aire acondicionado',
        estado: 'disponible',
      },
      {
        codigo_aula: 'FICO-102',
        nombre_aula: 'Aula 102',
        capacidad: 80,
        edificio: 'Facultad Integral del Chaco',
        piso: 1,
        tipo_aula: 'tradicional',
        equipamiento: 'Proyector, pizarra acrílica, aire acondicionado',
        estado: 'disponible',
      },
      {
        codigo_aula: 'FICO-103',
        nombre_aula: 'Aula 103',
        capacidad: 60,
        edificio: 'Facultad Integral del Chaco',
        piso: 1,
        tipo_aula: 'tradicional',
        equipamiento: 'Proyector, pizarra acrílica',
        estado: 'disponible',
      },
      {
        codigo_aula: 'FICO-201',
        nombre_aula: 'Aula 201',
        capacidad: 70,
        edificio: 'Facultad Integral del Chaco',
        piso: 2,
        tipo_aula: 'tradicional',
        equipamiento: 'Proyector, pizarra acrílica, aire acondicionado',
        estado: 'disponible',
      },
      {
        codigo_aula: 'FICO-202',
        nombre_aula: 'Aula 202',
        capacidad: 65,
        edificio: 'Facultad Integral del Chaco',
        piso: 2,
        tipo_aula: 'tradicional',
        equipamiento: 'Proyector, pizarra acrílica',
        estado: 'disponible',
      },

      // Laboratorios de Informática
      {
        codigo_aula: 'LAB-INF1',
        nombre_aula: 'Laboratorio de Programación 1',
        capacidad: 30,
        edificio: 'Facultad Integral del Chaco',
        piso: 1,
        tipo_aula: 'laboratorio',
        equipamiento: '30 computadoras, proyector, servidor local, software de desarrollo',
        estado: 'disponible',
      },
      {
        codigo_aula: 'LAB-INF2',
        nombre_aula: 'Laboratorio de Programación 2',
        capacidad: 25,
        edificio: 'Facultad Integral del Chaco',
        piso: 1,
        tipo_aula: 'laboratorio',
        equipamiento: '25 computadoras, proyector, software especializado',
        estado: 'disponible',
      },
      {
        codigo_aula: 'LAB-INF3',
        nombre_aula: 'Laboratorio de Redes',
        capacidad: 20,
        edificio: 'Facultad Integral del Chaco',
        piso: 2,
        tipo_aula: 'laboratorio',
        equipamiento: 'Equipos de red, switches, routers, simuladores',
        estado: 'disponible',
      },
      {
        codigo_aula: 'LAB-HW',
        nombre_aula: 'Laboratorio de Hardware',
        capacidad: 15,
        edificio: 'Facultad Integral del Chaco',
        piso: 2,
        tipo_aula: 'laboratorio',
        equipamiento: 'Herramientas, componentes de hardware, bancos de trabajo',
        estado: 'mantenimiento',
      },
      {
        codigo_aula: 'LAB-SIS',
        nombre_aula: 'Laboratorio de Sistemas',
        capacidad: 35,
        edificio: 'Facultad Integral del Chaco',
        piso: 3,
        tipo_aula: 'laboratorio',
        equipamiento: '35 computadoras, servidores, software de gestión',
        estado: 'disponible',
      },

      // Aulas del segundo piso
      {
        codigo_aula: 'FICO-301',
        nombre_aula: 'Aula de Seminarios',
        capacidad: 40,
        edificio: 'Facultad Integral del Chaco',
        piso: 3,
        tipo_aula: 'tradicional',
        equipamiento: 'Mesa redonda, proyector, sistema de videoconferencia',
        estado: 'disponible',
      },
      {
        codigo_aula: 'FICO-302',
        nombre_aula: 'Aula de Posgrado',
        capacidad: 25,
        edificio: 'Facultad Integral del Chaco',
        piso: 3,
        tipo_aula: 'tradicional',
        equipamiento: 'Mobiliario ejecutivo, proyector, aire acondicionado',
        estado: 'disponible',
      },
    ];

    for (const classroomData of classrooms) {
      const existingClassroom = await this.classroomRepository.findOne({
        where: { codigo_aula: classroomData.codigo_aula },
      });

      if (!existingClassroom) {
        const classroom = this.classroomRepository.create(classroomData);
        await this.classroomRepository.save(classroom);
        this.logger.log(`✅ Created classroom: ${classroomData.nombre_aula} (${classroomData.codigo_aula})`);
      } else {
        this.logger.log(`⚠️ Classroom already exists: ${classroomData.codigo_aula}`);
      }
    }

    this.logger.log('✅ Classrooms seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing classrooms...');
    await this.classroomRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Classrooms cleared');
  }
}
