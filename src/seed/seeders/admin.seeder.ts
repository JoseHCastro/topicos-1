import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../../auth/entities/admin.entity';
import { User } from '../../auth/entities/user.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class AdminSeeder implements SeederInterface {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding admins...');

    const adminData = {
      email: 'admin@uagrm.edu.bo',
      password: '$2b$10$6jOTgVnlS99Z/LJ1n8a/n.0rkwHWgR6VYf/9xPBxgQdE.7s6cQjri', // bcrypt hash for '123456'
      first_name: 'Administrador',
      last_name: 'Sistema',
      user_type: 'ADMIN',
      status: 'Active',
    };

    const existingAdmin = await this.adminRepository.findOne({
      where: { email: adminData.email },
    });

    if (!existingAdmin) {
      const admin = this.adminRepository.create(adminData);
      await this.adminRepository.save(admin);
      this.logger.log(`Created admin: ${adminData.email}`);
    } else {
      this.logger.log(`Admin already exists: ${adminData.email}`);
    }

    this.logger.log('Admins seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing admins...');
    await this.adminRepository.createQueryBuilder().delete().execute();
    this.logger.log('Admins cleared');
  }
}
