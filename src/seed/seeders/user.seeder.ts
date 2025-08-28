import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../auth/entities/user.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class UserSeeder implements SeederInterface {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding users...');

    const users = [
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        first_name: 'System',
        last_name: 'Administrator',
        user_type: 'Admin',
        phone: '+591-12345678',
        status: 'Active',
      },
      {
        email: 'professor@example.com',
        password: await bcrypt.hash('professor123', 10),
        first_name: 'John',
        last_name: 'Professor',
        user_type: 'Teacher',
        phone: '+591-87654321',
        status: 'Active',
      },
      {
        email: 'student@example.com',
        password: await bcrypt.hash('student123', 10),
        first_name: 'Jane',
        last_name: 'Student',
        user_type: 'Student',
        phone: '+591-11223344',
        status: 'Active',
      },
    ];

    for (const userData of users) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = this.userRepository.create(userData);
        await this.userRepository.save(user);
        this.logger.log(`Created user: ${userData.email}`);
      } else {
        this.logger.log(`User already exists: ${userData.email}`);
      }
    }

    this.logger.log('Users seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing users...');
    await this.userRepository
      .createQueryBuilder()
      .delete()
    .where('user_type = :admin', { admin: 'Admin' })
    .orWhere('user_type = :teacher', { teacher: 'Teacher' })
    .orWhere('user_type = :student', { student: 'Student' })
      .execute();
    this.logger.log('Users cleared');
  }
}
