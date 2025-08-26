import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { Admin } from '../auth/entities/admin.entity';
import { Professor } from '../auth/entities/professor.entity';
import { Student } from '../auth/entities/student.entity';
import { UserSeeder } from './seeders/user.seeder';
import { SeedService } from './seed.service';
import { AdminSeeder } from './seeders/admin.seeder';
import { ProfessorSeeder } from './seeders/professor.seeder';
import { StudentSeeder } from './seeders/student.seeder';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, Admin, Professor, Student])
  ],
  providers: [
    SeedService,
    UserSeeder,
    AdminSeeder,
    ProfessorSeeder,
    StudentSeeder,
  ],
  exports: [SeedService],
})
export class SeedModule {}
