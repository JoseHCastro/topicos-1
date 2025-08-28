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
        email: 'admin@uagrm.edu.bo',
        password: await bcrypt.hash('123456', 10),
        first_name: 'Administrador',
        last_name: 'Sistema',
        user_type: 'ADMIN',
        status: 'Active',
      },
      {
        email: 'docente@uagrm.edu.bo',
        password: await bcrypt.hash('123456', 10),
        first_name: 'Juan',
        last_name: 'Pérez Docente',
        user_type: 'TEACHER',
        status: 'Active',
      },
      {
        email: 'estudiante@uagrm.edu.bo',
        password: await bcrypt.hash('123456', 10),
        first_name: 'María',
        last_name: 'González Estudiante',
        user_type: 'STUDENT',
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
        this.logger.log(`Created user: ${userData.email} with type: ${userData.user_type}`);
      } else {
        this.logger.log(`User already exists: ${userData.email} with type: ${existingUser.user_type}`);
      }
    }

    this.logger.log('Users seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing users...');
    await this.userRepository.createQueryBuilder().delete().execute();
    this.logger.log('Users cleared');
  }
}
