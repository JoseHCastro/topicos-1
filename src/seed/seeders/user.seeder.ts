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
    this.logger.log('🌱 Seeding users...');

    const users = [
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
      },
      {
        email: 'professor@example.com',
        password: await bcrypt.hash('professor123', 10),
        firstName: 'John',
        lastName: 'Professor',
        role: 'PROFESSOR',
      },
      {
        email: 'student@example.com',
        password: await bcrypt.hash('student123', 10),
        firstName: 'Jane',
        lastName: 'Student',
        role: 'STUDENT',
      },
    ];

    for (const userData of users) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = this.userRepository.create(userData);
        await this.userRepository.save(user);
        this.logger.log(`✅ Created user: ${userData.email}`);
      } else {
        this.logger.log(`⚠️ User already exists: ${userData.email}`);
      }
    }

    this.logger.log('✅ Users seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing users...');
    await this.userRepository
      .createQueryBuilder()
      .delete()
      .where('type = :type', { type: 'User' })
      .execute();
    this.logger.log('✅ Users cleared');
  }
}
