import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Student } from '../../auth/entities/student.entity';
import { Period } from '../../academic-calendar/entities/period.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class EnrollmentSeeder implements SeederInterface {
  private readonly logger = new Logger(EnrollmentSeeder.name);

  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Period)
    private readonly periodRepository: Repository<Period>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding enrollments...');

    const students = await this.studentRepository.find();
    const periods = await this.periodRepository.find({
      where: { estado: 'activo' }
    });

    if (students.length === 0 || periods.length === 0) {
      this.logger.warn('⚠️ Missing required data (students or active periods), skipping enrollments seeding');
      return;
    }

    const activePeriod = periods[0];
    const enrollmentTypes = ['regular', 'segunda', 'final'];
    const enrollmentStates = ['activa', 'cancelada', 'finalizada'];

    // Crear inscripciones para cada estudiante
    for (const student of students) {
      const enrollmentTypeIndex = Math.floor(Math.random() * enrollmentTypes.length);
      const stateIndex = Math.floor(Math.random() * enrollmentStates.length);

      const enrollmentData = {
        fecha_inscripcion: new Date(),
        tipo_inscripcion: enrollmentTypes[enrollmentTypeIndex] as any,
        estado: enrollmentStates[stateIndex] as any,
      };

      const existingEnrollment = await this.enrollmentRepository.findOne({
        where: {
          estudiante: { id: student.id },
          periodo: { id_periodo: activePeriod.id_periodo }
        },
        relations: ['estudiante', 'periodo']
      });

      if (!existingEnrollment) {
        const enrollment = this.enrollmentRepository.create({
          ...enrollmentData,
          estudiante: student,
          periodo: activePeriod,
        });
        await this.enrollmentRepository.save(enrollment);
        this.logger.log(`✅ Created enrollment for student: ${student.firstName} ${student.lastName}`);
      } else {
        this.logger.log(`⚠️ Enrollment already exists for student: ${student.firstName} ${student.lastName}`);
      }
    }

    this.logger.log('✅ Enrollments seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing enrollments...');
    await this.enrollmentRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Enrollments cleared');
  }
}
