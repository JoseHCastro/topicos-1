import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SubjectGroup } from '../../courses/entities/subject-group.entity';
import { Subject } from '../../programs/entities/subject.entity';
import { Professor } from '../../auth/entities/professor.entity';
import { Period } from '../../academic-calendar/entities/period.entity';
import { Classroom } from '../../courses/entities/classroom.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class SubjectGroupSeeder implements SeederInterface {
  private readonly logger = new Logger(SubjectGroupSeeder.name);

  constructor(
    @InjectRepository(SubjectGroup)
    private readonly subjectGroupRepository: Repository<SubjectGroup>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,
    @InjectRepository(Period)
    private readonly periodRepository: Repository<Period>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding subject groups...');

    // Obtener datos necesarios
    const subjects = await this.subjectRepository.find();
    const professors = await this.professorRepository.find();
    const periods = await this.periodRepository.find({ 
      where: { estado: 'activo' }
    });
    const classrooms = await this.classroomRepository.find();

    if (subjects.length === 0 || professors.length === 0 || periods.length === 0 || classrooms.length === 0) {
      this.logger.warn('⚠️ Missing required data (subjects, professors, periods, or classrooms), skipping subject groups seeding');
      return;
    }

    const activePeriod = periods[0]; // Primer período activo

    // Crear grupos para las primeras materias (limitamos para ejemplo)
    const sampleSubjects = subjects.slice(0, 5);
    
    for (const subject of sampleSubjects) {
      const professorIndex = Math.floor(Math.random() * professors.length);
      const classroomIndex = Math.floor(Math.random() * classrooms.length);
      
      // Crear 2 grupos por materia
      for (let groupNumber = 1; groupNumber <= 2; groupNumber++) {
        const groupData = {
          id_materia: subject.id_materia,
          numero_grupo: `G${groupNumber.toString().padStart(2, '0')}`,
          cupo_maximo: groupNumber === 1 ? 35 : 30, // Grupo 1 más grande
          cupo_actual: Math.floor(Math.random() * (groupNumber === 1 ? 35 : 30)),
          docente: `${professors[professorIndex].firstName} ${professors[professorIndex].lastName}`,
          estado: 'abierto' as const,
        };

        const existingGroup = await this.subjectGroupRepository.findOne({
          where: { 
            id_materia: groupData.id_materia,
            numero_grupo: groupData.numero_grupo
          },
        });

        if (!existingGroup) {
          const subjectGroup = this.subjectGroupRepository.create(groupData);
          await this.subjectGroupRepository.save(subjectGroup);
          this.logger.log(`✅ Created subject group: ${subject.nombre_materia} - ${groupData.numero_grupo}`);
        } else {
          this.logger.log(`⚠️ Subject group already exists: ${subject.nombre_materia} - ${groupData.numero_grupo}`);
        }
      }
    }

    this.logger.log('✅ Subject groups seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing subject groups...');
    await this.subjectGroupRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Subject groups cleared');
  }
}
