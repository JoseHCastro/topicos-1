import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { User } from '../../auth/entities/user.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class StudentSeeder implements SeederInterface {
  private readonly logger = new Logger(StudentSeeder.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding students...');

    const studentData = {
      email: 'estudiante@uagrm.edu.bo',
      password: '$2b$10$6jOTgVnlS99Z/LJ1n8a/n.0rkwHWgR6VYf/9xPBxgQdE.7s6cQjri',
      first_name: 'María',
      last_name: 'González Estudiante',
      user_type: 'STUDENT',
      status: 'Active',
      code: '218801234',
      enrolled_at: new Date('2021-02-01'),
      birth_date: new Date('2000-05-15'),
      sex: 'F',
    };

    const existingStudent = await this.studentRepository.findOne({
      where: { code: studentData.code },
    });

    if (!existingStudent) {
      const student = this.studentRepository.create(studentData);
      await this.studentRepository.save(student);
      this.logger.log(`Created student: ${studentData.code} - ${studentData.email}`);
    } else {
      this.logger.log(`Student already exists: ${studentData.code}`);
    }

    this.logger.log('Students seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing students...');
    await this.studentRepository.createQueryBuilder().delete().execute();
    this.logger.log('Students cleared');
  }
}
