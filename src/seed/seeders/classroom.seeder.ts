import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from '../../facilities/entities';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class ClassroomSeeder implements SeederInterface {
  private readonly logger = new Logger(ClassroomSeeder.name);

  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async run(): Promise<void> {
    this.logger.log(' Seeding classrooms...');

    const classrooms = [
      // Edificio FICO - Aulas tradicionales
      {
        code: 'FICO-101',
        building: 'Building A',
        campus: 'Main Campus',
        capacity: 120,
        room_type: 'Lecture',
      },
      {
        code: 'FICO-102',
        building: 'Building A',
        campus: 'Main Campus',
        capacity: 80,
        room_type: 'Lecture',
      },
      {
        code: 'FICO-103',
        building: 'Building A',
        campus: 'Main Campus',
        capacity: 60,
        room_type: 'Lecture',
      },
      {
        code: 'FICO-201',
        building: 'Building A',
        campus: 'Main Campus',
        capacity: 70,
        room_type: 'Lecture',
      },
      {
        code: 'FICO-202',
        building: 'Building A',
        campus: 'Main Campus',
        capacity: 65,
        room_type: 'Lecture',
      },

      // Laboratorios de Informática
      {
        code: 'LAB-INF1',
        building: 'Building B',
        campus: 'Main Campus',
        capacity: 30,
        room_type: 'Lab',
      },
      {
        code: 'LAB-INF2',
        building: 'Building B',
        campus: 'Main Campus',
        capacity: 25,
        room_type: 'Lab',
      },
      {
        code: 'LAB-INF3',
        building: 'Building B',
        campus: 'Main Campus',
        capacity: 20,
        room_type: 'Lab',
      },
      {
        code: 'LAB-HW',
        building: 'Building B',
        campus: 'Main Campus',
        capacity: 15,
        room_type: 'Lab',
      },
      {
        code: 'LAB-SIS',
        building: 'Building B',
        campus: 'Main Campus',
        capacity: 35,
        room_type: 'Lab',
      },

      // Aulas del segundo piso
      {
        code: 'FICO-301',
        building: 'Building A',
        campus: 'Main Campus',
        capacity: 40,
        room_type: 'Lecture',
      },
      {
        code: 'FICO-302',
        building: 'Building A',
        campus: 'Main Campus',
        capacity: 25,
        room_type: 'Lecture',
      },
    ];

    for (const classroomData of classrooms) {
      const existingClassroom = await this.classroomRepository.findOne({
        where: { code: classroomData.code },
      });

      if (!existingClassroom) {
        const classroom = this.classroomRepository.create(classroomData);
        await this.classroomRepository.save(classroom);
        this.logger.log(` Created classroom: ${classroomData.code} - ${classroomData.building}`);
      } else {
        this.logger.log(` Classroom already exists: ${classroomData.code}`);
      }
    }

    this.logger.log(' Classrooms seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log(' Clearing classrooms...');
    await this.classroomRepository.createQueryBuilder().delete().execute();
    this.logger.log(' Classrooms cleared');
  }
}
