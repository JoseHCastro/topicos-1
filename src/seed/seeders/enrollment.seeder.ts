import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Student } from '../../auth/entities/student.entity';
import { Term } from '../../calendar/entities/term.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class EnrollmentSeeder implements SeederInterface {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
  ) {}

  async run(): Promise<void> {
    console.log('Seeding enrollments...');

    // Obtener estudiantes y términos
    const students = await this.studentRepository.find();
    const currentTerm = await this.termRepository.findOne({ 
      where: { name: '2025-I' } 
    });
    const previousTerm = await this.termRepository.findOne({ 
      where: { name: '2024-II' } 
    });

    if (students.length === 0 || !currentTerm) {
      console.log('Prerequisites not found for enrollment seeding');
      return;
    }

    const enrollmentsData: any[] = [];

    // Crear inscripción actual para cada estudiante
    for (const student of students) {
      enrollmentsData.push({
        student_id: student.id,
        term_id: currentTerm.id,
        enrolled_on: new Date('2025-01-15'),
        state: 'Active',
        origin: 'Regular',
        note: 'Inscripción regular para el semestre actual',
      });

      // Crear inscripción anterior si existe el término
      if (previousTerm) {
        enrollmentsData.push({
          student_id: student.id,
          term_id: previousTerm.id,
          enrolled_on: new Date('2024-08-15'),
          state: 'Completed',
          origin: 'Regular',
          note: 'Semestre anterior completado',
        });
      }
    }

    for (const enrollmentData of enrollmentsData) {
      const existingEnrollment = await this.enrollmentRepository.findOne({
        where: {
          student_id: enrollmentData.student_id,
          term_id: enrollmentData.term_id,
        },
      });

      if (!existingEnrollment) {
        const enrollment = this.enrollmentRepository.create(enrollmentData);
        await this.enrollmentRepository.save(enrollment);
        
        const student = students.find(s => s.id === enrollmentData.student_id);
        const term = enrollmentData.term_id === currentTerm.id ? currentTerm : previousTerm;
        console.log(`Created enrollment: ${student?.code} for term ${term?.name}`);
      } else {
        const student = students.find(s => s.id === enrollmentData.student_id);
        const term = enrollmentData.term_id === currentTerm.id ? currentTerm : previousTerm;
        console.log(`Enrollment already exists: ${student?.code} for term ${term?.name}`);
      }
    }

    console.log('Enrollments seeding completed');
  }

  async clear(): Promise<void> {
    console.log('Clearing enrollments...');
    await this.enrollmentRepository.delete({});
    console.log('Enrollments cleared');
  }
}
