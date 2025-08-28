import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from '../../auth/entities/teacher.entity';
import { User } from '../../auth/entities/user.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class TeacherSeeder implements SeederInterface {
  private readonly logger = new Logger(TeacherSeeder.name);

  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding teachers...');

    // Create teacher directly in the teacher repository (this will create the user as well due to inheritance)
    const teacherData = {
      email: 'docente@uagrm.edu.bo',
      password: '$2b$10$6jOTgVnlS99Z/LJ1n8a/n.0rkwHWgR6VYf/9xPBxgQdE.7s6cQjri', // bcrypt hash for '123456'
      first_name: 'Juan',
      last_name: 'Pérez Docente',
      user_type: 'TEACHER',
      status: 'Active',
      category: 'Titular',
      workload: 'FullTime',
      contract_type: 'Indefinido',
      hired_at: new Date('2020-01-15'),
    };

    const existingTeacher = await this.teacherRepository.findOne({
      where: { email: teacherData.email },
    });

    if (!existingTeacher) {
      const teacher = this.teacherRepository.create(teacherData);
      await this.teacherRepository.save(teacher);
      this.logger.log(`Created teacher: ${teacherData.email}`);
    } else {
      this.logger.log(`Teacher already exists: ${teacherData.email}`);
    }

    this.logger.log('Teachers seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing teachers...');
    await this.teacherRepository.createQueryBuilder().delete().execute();
    this.logger.log('Teachers cleared');
  }
}
