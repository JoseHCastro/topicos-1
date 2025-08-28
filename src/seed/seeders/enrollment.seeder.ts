import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Student } from '../../auth/entities/student.entity';
import { Term } from '../../calendar/entities/term.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class EnrollmentSeeder implements SeederInterface {
  private readonly logger = new Logger(EnrollmentSeeder.name);

  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
  ) {}

  async run(): Promise<void> {
    this.logger.log(' Seeding enrollments...');

    const students = await this.studentRepository.find();
    const terms = await this.termRepository.find();

    if (students.length === 0 || terms.length === 0) {
      this.logger.warn(' Missing required data (students or terms), skipping enrollments seeding');
      return;
    }

    const activeTerm = terms.find(t => t.status === 'active') || terms[0];

    // Crear inscripciones para cada estudiante
    for (const student of students) {
      const enrollmentData = {
        student_id: student.id,
        term_id: activeTerm.id,
        enrolled_on: new Date(),
        state: 'Active',
        origin: 'Regular',
        note: `Enrollment for student ${student.first_name} ${student.last_name}`,
      };

      const existingEnrollment = await this.enrollmentRepository.findOne({
        where: {
          student_id: student.id,
          term_id: activeTerm.id,
        },
      });

      if (!existingEnrollment) {
        const enrollment = this.enrollmentRepository.create(enrollmentData);
        await this.enrollmentRepository.save(enrollment);
        this.logger.log(` Created enrollment for student: ${student.first_name} ${student.last_name}`);
      } else {
        this.logger.log(` Enrollment already exists for student: ${student.first_name} ${student.last_name}`);
      }
    }

    this.logger.log(' Enrollments seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log(' Clearing enrollments...');
    await this.enrollmentRepository.createQueryBuilder().delete().execute();
    this.logger.log(' Enrollments cleared');
  }
}
