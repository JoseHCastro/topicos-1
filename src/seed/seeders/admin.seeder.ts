import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from '../../auth/entities/admin.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class AdminSeeder implements SeederInterface {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding admins...');

    const admins = [
      {
        email: 'superadmin@example.com',
        password: await bcrypt.hash('superadmin123', 10),
        first_name: 'Super',
        last_name: 'Administrator',
        user_type: 'Admin',
        status: 'Active',
      },
      {
        email: 'admin2@example.com',
        password: await bcrypt.hash('admin123', 10),
        first_name: 'Secondary',
        last_name: 'Admin',
        user_type: 'Admin',
        status: 'Active',
      },
    ];

    for (const adminData of admins) {
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
    }

    this.logger.log('Admins seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing admins...');
    await this.adminRepository
      .createQueryBuilder()
      .delete()
    .where('user_type = :user_type', { user_type: 'Admin' })
      .execute();
    this.logger.log('Admins cleared');
  }
}
