import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Professor, ProfessorStatus } from '../../auth/entities/professor.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class ProfessorSeeder implements SeederInterface {
  private readonly logger = new Logger(ProfessorSeeder.name);

  constructor(
    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding professors...');

    const professors = [
      {
        email: 'prof.mathematics@example.com',
        password: await bcrypt.hash('professor123', 10),
        firstName: 'Carlos',
        lastName: 'Matemático',
        role: 'PROFESSOR',
        professorCode: 'PROF001',
        department: 'Mathematics',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'prof.physics@example.com',
        password: await bcrypt.hash('professor123', 10),
        firstName: 'Ana',
        lastName: 'Física',
        role: 'PROFESSOR',
        professorCode: 'PROF002',
        department: 'Physics',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'prof.chemistry@example.com',
        password: await bcrypt.hash('professor123', 10),
        firstName: 'Luis',
        lastName: 'Química',
        role: 'PROFESSOR',
        professorCode: 'PROF003',
        department: 'Chemistry',
        status: ProfessorStatus.INACTIVE,
      },
    ];

    for (const professorData of professors) {
      const existingProfessor = await this.professorRepository.findOne({
        where: [
          { email: professorData.email },
          { professorCode: professorData.professorCode }
        ],
      });

      if (!existingProfessor) {
        const professor = this.professorRepository.create(professorData);
        await this.professorRepository.save(professor);
        this.logger.log(`✅ Created professor: ${professorData.email} (${professorData.professorCode})`);
      } else {
        this.logger.log(`⚠️ Professor already exists: ${professorData.email}`);
      }
    }

    this.logger.log('✅ Professors seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing professors...');
    await this.professorRepository.clear();
    this.logger.log('✅ Professors cleared');
  }
}
