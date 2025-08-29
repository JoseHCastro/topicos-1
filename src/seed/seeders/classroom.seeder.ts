import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from '../../facilities/entities/classroom.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class ClassroomSeeder implements SeederInterface {
  private readonly logger = new Logger(ClassroomSeeder.name);

  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding classrooms...');

    const classrooms = [
      {
        code: 'FICO-101',
        building: 'Edificio FICO',
        campus: 'Campus Central',
        capacity: 40,
        room_type: 'Lecture',
      },
      {
        code: 'FICO-102',
        building: 'Edificio FICO',
        campus: 'Campus Central',
        capacity: 35,
        room_type: 'Lecture',
      },
      {
        code: 'FICO-201',
        building: 'Edificio FICO',
        campus: 'Campus Central',
        capacity: 45,
        room_type: 'Lecture',
      },
      {
        code: 'LAB-INF1',
        building: 'Laboratorio Informática',
        campus: 'Campus Central',
        capacity: 30,
        room_type: 'Lab',
      },
      {
        code: 'LAB-INF2',
        building: 'Laboratorio Informática',
        campus: 'Campus Central',
        capacity: 25,
        room_type: 'Lab',
      },
      {
        code: 'LAB-HW',
        building: 'Laboratorio Hardware',
        campus: 'Campus Central',
        capacity: 20,
        room_type: 'Lab',
      },
    ];

    for (const classroomData of classrooms) {
      const existingClassroom = await this.classroomRepository.findOne({
        where: { code: classroomData.code },
      });

      if (!existingClassroom) {
        const classroom = this.classroomRepository.create(classroomData);
        await this.classroomRepository.save(classroom);
        this.logger.log(`Created classroom: ${classroomData.code}`);
      } else {
        this.logger.log(`Classroom already exists: ${classroomData.code}`);
      }
    }

    this.logger.log('Classrooms seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing classrooms...');
    await this.classroomRepository.createQueryBuilder().delete().execute();
    this.logger.log('Classrooms cleared');
  }
}
