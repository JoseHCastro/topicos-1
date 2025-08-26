import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prerequisite } from '../../programs/entities/prerequisite.entity';
import { Subject } from '../../programs/entities/subject.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class PrerequisiteSeeder implements SeederInterface {
  private readonly logger = new Logger(PrerequisiteSeeder.name);

  constructor(
    @InjectRepository(Prerequisite)
    private readonly prerequisiteRepository: Repository<Prerequisite>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding prerequisites...');

    // Mapeo de prerequisitos según la malla curricular
    const prerequisites = [
      // SEGUNDO SEMESTRE
      { materia: 'LIN101', prerequisito: 'LIN100' }, // Inglés Técnico II -> Inglés Técnico I
      { materia: 'FIS102', prerequisito: 'FIS100' }, // Física II -> Física I
      { materia: 'INF120', prerequisito: 'INF110' }, // Programación I -> Introducción a la Informática
      { materia: 'MAT102', prerequisito: 'MAT101' }, // Cálculo II -> Cálculo I

      // TERCER SEMESTRE
      { materia: 'FISICA200', prerequisito: 'FIS102' }, // Física III -> Física II
      { materia: 'INF211', prerequisito: 'INF110' }, // Arquitectura de Computadoras -> Introducción a la Informática
      { materia: 'INF210', prerequisito: 'INF120' }, // Programación II -> Programación I
      { materia: 'MAT207', prerequisito: 'MAT102' }, // Ecuaciones Diferenciales -> Cálculo II

      // CUARTO SEMESTRE
      { materia: 'INF221', prerequisito: 'INF211' }, // Programación Ensamblador -> Arquitectura de Computadoras
      { materia: 'INF220', prerequisito: 'INF210' }, // Estructura de Datos I -> Programación II
      { materia: 'MAT205', prerequisito: 'MAT102' }, // Métodos Numéricos -> Cálculo II

      // QUINTO SEMESTRE
      { materia: 'INF318', prerequisito: 'INF210' }, // Programación Lógica y Funcional -> Programación II
      { materia: 'INF310', prerequisito: 'INF220' }, // Estructura de Datos II -> Estructura de Datos I
      { materia: 'INF319', prerequisito: 'INF119' }, // Lenguaje Formales -> Estructuras Discretas
      { materia: 'INF312', prerequisito: 'INF220' }, // Base de Datos I -> Estructura de Datos I
      { materia: 'MAT302', prerequisito: 'MAT202' }, // Probabilidades y Estadísticas II -> Probabilidades y Estadísticas I

      // SEXTO SEMESTRE
      { materia: 'INF329', prerequisito: 'INF319' }, // Compiladores -> Lenguaje Formales
      { materia: 'INF323', prerequisito: 'INF310' }, // Sistemas Operativos I -> Estructura de Datos II
      { materia: 'INF322', prerequisito: 'INF312' }, // Base de Datos II -> Base de Datos I
      { materia: 'INF342', prerequisito: 'INF312' }, // Sistema de Información I -> Base de Datos I
      { materia: 'MAT329', prerequisito: 'MAT302' }, // Investigación Operativa I -> Probabilidades y Estadísticas II

      // SÉPTIMO SEMESTRE
      { materia: 'INF418', prerequisito: 'INF310' }, // Inteligencia Artificial -> Estructura de Datos II
      { materia: 'INF433', prerequisito: 'INF323' }, // Redes I -> Sistemas Operativos I
      { materia: 'INF413', prerequisito: 'INF323' }, // Sistemas Operativos II -> Sistemas Operativos I
      { materia: 'INF412', prerequisito: 'INF342' }, // Sistema de Información II -> Sistema de Información I
      { materia: 'MAT419', prerequisito: 'MAT329' }, // Investigación Operativa II -> Investigación Operativa I

      // OCTAVO SEMESTRE
      { materia: 'INF423', prerequisito: 'INF433' }, // Redes II -> Redes I
      { materia: 'INF428', prerequisito: 'INF418' }, // Sistemas Expertos -> Inteligencia Artificial
      { materia: 'INF422', prerequisito: 'INF412' }, // Ingeniería de Software -> Sistema de Información II
      { materia: 'INF442', prerequisito: 'INF412' }, // Sistema de Información Geográfica -> Sistema de Información II

      // NOVENO SEMESTRE
      { materia: 'INF512', prerequisito: 'INF422' }, // Ingeniería de Software II -> Ingeniería de Software
      { materia: 'INF513', prerequisito: 'INF322' }, // Tecnología Web -> Base de Datos II
      { materia: 'INF552', prerequisito: 'INF422' }, // Arquitectura de Software II -> Ingeniería de Software

      // Prerequisites adicionales basados en las flechas del diagrama
      { materia: 'INF310', prerequisito: 'INF119' }, // Estructura de Datos II también depende de Estructuras Discretas
      { materia: 'MAT205', prerequisito: 'MAT103' }, // Métodos Numéricos también depende de Álgebra Lineal
      { materia: 'INF342', prerequisito: 'ADM100' }, // Sistema de Información I depende de Administración
    ];

    for (const prereq of prerequisites) {
      // Buscar las materias
      const materia = await this.subjectRepository.findOne({
        where: { codigo_materia: prereq.materia },
      });

      const materiaPrerequisito = await this.subjectRepository.findOne({
        where: { codigo_materia: prereq.prerequisito },
      });

      if (!materia) {
        this.logger.warn(`⚠️ Subject not found: ${prereq.materia}`);
        continue;
      }

      if (!materiaPrerequisito) {
        this.logger.warn(`⚠️ Prerequisite subject not found: ${prereq.prerequisito}`);
        continue;
      }

      // Verificar si el prerequisito ya existe
      const existingPrerequisite = await this.prerequisiteRepository.findOne({
        where: {
          id_materia: materia.id_materia,
          id_materia_prerequisito: materiaPrerequisito.id_materia,
        },
      });

      if (!existingPrerequisite) {
        const prerequisite = this.prerequisiteRepository.create({
          id_materia: materia.id_materia,
          id_materia_prerequisito: materiaPrerequisito.id_materia,
          tipo_prerequisito: 'obligatorio',
        });

        await this.prerequisiteRepository.save(prerequisite);
        this.logger.log(`✅ Created prerequisite: ${prereq.materia} requires ${prereq.prerequisito}`);
      } else {
        this.logger.log(`⚠️ Prerequisite already exists: ${prereq.materia} -> ${prereq.prerequisito}`);
      }
    }

    this.logger.log('✅ Prerequisites seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🗑️ Clearing prerequisites...');
    await this.prerequisiteRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Prerequisites cleared');
  }
}
