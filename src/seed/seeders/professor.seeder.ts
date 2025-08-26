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
        email: 'carlos.matemat@docente.uagrm.edu.bo',
        password: await bcrypt.hash('profesor123', 10),
        firstName: 'Carlos Eduardo',
        lastName: 'Vásquez Morales',
        role: 'PROFESSOR',
        professorCode: 'DOC001',
        department: 'Departamento de Matemáticas',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'ana.fisica@docente.uagrm.edu.bo',
        password: await bcrypt.hash('profesor123', 10),
        firstName: 'Ana María',
        lastName: 'Gutiérrez Roca',
        role: 'PROFESSOR',
        professorCode: 'DOC002',
        department: 'Departamento de Física',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'luis.programacion@docente.uagrm.edu.bo',
        password: await bcrypt.hash('profesor123', 10),
        firstName: 'Luis Fernando',
        lastName: 'Mendoza Paz',
        role: 'PROFESSOR',
        professorCode: 'DOC003',
        department: 'Departamento de Informática',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'maria.sistemas@docente.uagrm.edu.bo',
        password: await bcrypt.hash('profesor123', 10),
        firstName: 'María del Carmen',
        lastName: 'López Herrera',
        role: 'PROFESSOR',
        professorCode: 'DOC004',
        department: 'Departamento de Sistemas',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'pedro.estructuras@docente.uagrm.edu.bo',
        password: await bcrypt.hash('profesor123', 10),
        firstName: 'Pedro Antonio',
        lastName: 'Rivero Sánchez',
        role: 'PROFESSOR',
        professorCode: 'DOC005',
        department: 'Departamento de Informática',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'jose.algoritmos@docente.uagrm.edu.bo',
        password: await bcrypt.hash('profesor123', 10),
        firstName: 'José Luis',
        lastName: 'Fernández Castro',
        role: 'PROFESSOR',
        professorCode: 'DOC006',
        department: 'Departamento de Informática',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'sofia.redes@docente.uagrm.edu.bo',
        password: await bcrypt.hash('profesor123', 10),
        firstName: 'Sofía Esperanza',
        lastName: 'Martínez Villa',
        role: 'PROFESSOR',
        professorCode: 'DOC007',
        department: 'Departamento de Redes y Comunicaciones',
        status: ProfessorStatus.ACTIVE,
      },
      {
        email: 'roberto.basedatos@docente.uagrm.edu.bo',
        password: await bcrypt.hash('profesor123', 10),
        firstName: 'Roberto Carlos',
        lastName: 'Velasco Torrez',
        role: 'PROFESSOR',
        professorCode: 'DOC008',
        department: 'Departamento de Informática',
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
    await this.professorRepository
      .createQueryBuilder()
      .delete()
      .where('type = :type', { type: 'Professor' })
      .execute();
    this.logger.log('✅ Professors cleared');
  }
}
