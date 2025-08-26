import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student, StudentStatus } from '../../auth/entities/student.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class StudentSeeder implements SeederInterface {
  private readonly logger = new Logger(StudentSeeder.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding students...');

    const students = [
      {
        email: 'juan.perez@student.com',
        password: await bcrypt.hash('student123', 10),
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'STUDENT',
        studentId: 'STU001',
        career: 'Computer Science',
        status: StudentStatus.ACTIVE,
      },
      {
        email: 'maria.garcia@student.com',
        password: await bcrypt.hash('student123', 10),
        firstName: 'María',
        lastName: 'García',
        role: 'STUDENT',
        studentId: 'STU002',
        career: 'Engineering',
        status: StudentStatus.ACTIVE,
      },
      {
        email: 'pedro.martinez@student.com',
        password: await bcrypt.hash('student123', 10),
        firstName: 'Pedro',
        lastName: 'Martínez',
        role: 'STUDENT',
        studentId: 'STU003',
        career: 'Mathematics',
        status: StudentStatus.INACTIVE,
      },
      {
        email: 'ana.rodriguez@student.com',
        password: await bcrypt.hash('student123', 10),
        firstName: 'Ana',
        lastName: 'Rodríguez',
        role: 'STUDENT',
        studentId: 'STU004',
        career: 'Physics',
        status: StudentStatus.ACTIVE,
      },
    ];

    for (const studentData of students) {
      const existingStudent = await this.studentRepository.findOne({
        where: [
          { email: studentData.email },
          { studentId: studentData.studentId }
        ],
      });

      if (!existingStudent) {
        const student = this.studentRepository.create(studentData);
        await this.studentRepository.save(student);
        this.logger.log(`✅ Created student: ${studentData.email} (${studentData.studentId})`);
      } else {
        this.logger.log(`⚠️ Student already exists: ${studentData.email}`);
      }
    }

    this.logger.log('✅ Students seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing students...');
    await this.studentRepository.clear();
    this.logger.log('✅ Students cleared');
  }
}
