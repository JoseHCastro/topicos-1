import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student, StudentStatus } from '../../auth/entities/student.entity';
import { Career } from '../../programs/entities/career.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class StudentSeeder implements SeederInterface {
  private readonly logger = new Logger(StudentSeeder.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding students...');

    // Obtener una carrera para asignar a los estudiantes
    const career = await this.careerRepository.findOne({
      where: { codigo_carrera: '187-3' }
    });

    if (!career) {
      this.logger.error('❌ Career 187-3 not found. Please run career seeder first.');
      return;
    }

    const students = [
      {
        email: 'juan.perez@estudiante.uagrm.edu.bo',
        password: await bcrypt.hash('estudiante123', 10),
        firstName: 'Juan Carlos',
        lastName: 'Pérez González',
        role: 'STUDENT',
        studentCode: 'EST001',
        nationalId: '12345678',
        birthDate: new Date('2001-03-15'),
        phone: '78945612',
        status: StudentStatus.ACTIVE,
        career: career,
      },
      {
        email: 'maria.garcia@estudiante.uagrm.edu.bo',
        password: await bcrypt.hash('estudiante123', 10),
        firstName: 'María Elena',
        lastName: 'García López',
        role: 'STUDENT',
        studentCode: 'EST002',
        nationalId: '87654321',
        birthDate: new Date('2000-07-22'),
        phone: '79856234',
        status: StudentStatus.ACTIVE,
        career: career,
      },
      {
        email: 'carlos.rodriguez@estudiante.uagrm.edu.bo',
        password: await bcrypt.hash('estudiante123', 10),
        firstName: 'Carlos Alberto',
        lastName: 'Rodríguez Vásquez',
        role: 'STUDENT',
        studentCode: 'EST003',
        nationalId: '11223344',
        birthDate: new Date('2002-01-10'),
        phone: '77123456',
        status: StudentStatus.ACTIVE,
        career: career,
      },
      {
        email: 'ana.martinez@estudiante.uagrm.edu.bo',
        password: await bcrypt.hash('estudiante123', 10),
        firstName: 'Ana Sofía',
        lastName: 'Martínez Flores',
        role: 'STUDENT',
        studentCode: 'EST004',
        nationalId: '55667788',
        birthDate: new Date('2001-11-05'),
        phone: '78654321',
        status: StudentStatus.ACTIVE,
        career: career,
      },
      {
        email: 'pedro.fernandez@estudiante.uagrm.edu.bo',
        password: await bcrypt.hash('estudiante123', 10),
        firstName: 'Pedro Luis',
        lastName: 'Fernández Castro',
        role: 'STUDENT',
        studentCode: 'EST005',
        nationalId: '99887766',
        birthDate: new Date('2000-05-18'),
        phone: '76543210',
        status: StudentStatus.INACTIVE,
        career: career,
      },
    ];

    for (const studentData of students) {
      const existingStudent = await this.studentRepository.findOne({
        where: [
          { email: studentData.email },
          { nationalId: studentData.nationalId },
          { studentCode: studentData.studentCode }
        ],
      });

      if (!existingStudent) {
        const student = this.studentRepository.create(studentData);
        await this.studentRepository.save(student);
        this.logger.log(`✅ Created student: ${studentData.email} (${studentData.studentCode})`);
      } else {
        this.logger.log(`⚠️ Student already exists: ${studentData.email}`);
      }
    }

    this.logger.log('✅ Students seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing students...');
    await this.studentRepository
      .createQueryBuilder()
      .delete()
      .where('type = :type', { type: 'Student' })
      .execute();
    this.logger.log('✅ Students cleared');
  }
}
