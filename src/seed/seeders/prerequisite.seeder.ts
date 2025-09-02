import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prerequisite } from '../../programs/entities/prerequisite.entity';
import { Course } from '../../programs/entities/course.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class PrerequisiteSeeder implements SeederInterface {
  private readonly logger = new Logger(PrerequisiteSeeder.name);

  constructor(
    @InjectRepository(Prerequisite)
    private readonly prerequisiteRepository: Repository<Prerequisite>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding prerequisites...');

    const courses = await this.courseRepository.find();

    if (courses.length === 0) {
      this.logger.warn('No courses found, skipping prerequisites seeding');
      return;
    }

    const prerequisiteRules = [
      // 2° SEMESTRE PREREQUISITES
      { course_code: 'UNI101', prerequisite_code: 'UNI100' }, // Inglés Técnico II requires Inglés Técnico I
      { course_code: 'FIS102', prerequisite_code: 'FIS100' }, // Física II requires Física I
      { course_code: 'INF120', prerequisite_code: 'INF110' }, // Programación I requires Introducción a la Informática
      { course_code: 'MAT102', prerequisite_code: 'MAT101' }, // Cálculo II requires Cálculo I
      { course_code: 'MAT103', prerequisite_code: 'MAT101' }, // Álgebra Lineal requires Cálculo I

      // 3° SEMESTRE PREREQUISITES
      { course_code: 'FISICAOO', prerequisite_code: 'FIS102' }, // Física III requires Física II
      { course_code: 'INF210', prerequisite_code: 'INF120' }, // Programación II requires Programación I
      { course_code: 'INF211', prerequisite_code: 'INF120' }, // Arquitectura de Computadoras requires Programación I
      { course_code: 'MAT207', prerequisite_code: 'MAT102' }, // Ecuaciones Diferenciales requires Cálculo II

      // 4° SEMESTRE PREREQUISITES
      { course_code: 'INF220', prerequisite_code: 'INF210' }, // Estructura de Datos I requires Programación II
      { course_code: 'INF220', prerequisite_code: 'INF119' }, // Estructura de Datos I requires Estructuras Discretas
      { course_code: 'INF221', prerequisite_code: 'INF211' }, // Programación en Ensamblador requires Arquitectura de Computadoras
      { course_code: 'MAT202', prerequisite_code: 'MAT103' }, // Probabilidades y Estadística requires Álgebra Lineal
      { course_code: 'MAT205', prerequisite_code: 'MAT102' }, // Métodos Numéricos requires Cálculo II

      // 5° SEMESTRE PREREQUISITES
      { course_code: 'INF310', prerequisite_code: 'INF220' }, // Estructura de Datos II requires Estructura de Datos I
      { course_code: 'INF312', prerequisite_code: 'INF220' }, // Base de Datos I requires Estructura de Datos I
      { course_code: 'INF318', prerequisite_code: 'INF220' }, // Programación Lógica y Funcional requires Estructura de Datos I
      { course_code: 'INF319', prerequisite_code: 'INF220' }, // Lenguajes Formales requires Estructura de Datos I
      { course_code: 'MAT302', prerequisite_code: 'MAT202' }, // Probabilidades y Estadística II requires Probabilidades y Estadística

      // 6° SEMESTRE PREREQUISITES
      { course_code: 'INF322', prerequisite_code: 'INF312' }, // Base de Datos II requires Base de Datos I
      { course_code: 'INF323', prerequisite_code: 'INF310' }, // Sistemas Operativos I requires Estructura de Datos II
      { course_code: 'INF329', prerequisite_code: 'INF319' }, // Compiladores requires Lenguajes Formales
      { course_code: 'INF342', prerequisite_code: 'INF312' }, // Sistema de Información I requires Base de Datos I
      { course_code: 'MAT329', prerequisite_code: 'MAT302' }, // Investigación Operativa requires Probabilidades y Estadística II

      // 7° SEMESTRE PREREQUISITES
      { course_code: 'INF412', prerequisite_code: 'INF342' }, // Sistema de Información II requires Sistema de Información I
      { course_code: 'INF413', prerequisite_code: 'INF323' }, // Sistemas Operativos II requires Sistemas Operativos I
      { course_code: 'INF418', prerequisite_code: 'INF310' }, // Inteligencia Artificial requires Estructura de Datos II
      { course_code: 'INF433', prerequisite_code: 'INF323' }, // Redes I requires Sistemas Operativos I
      { course_code: 'MAT419', prerequisite_code: 'MAT329' }, // Investigación Operativa II requires Investigación Operativa

      // 8° SEMESTRE PREREQUISITES
      { course_code: 'INF422', prerequisite_code: 'INF412' }, // Ingeniería de Software I requires Sistema de Información II
      { course_code: 'INF423', prerequisite_code: 'INF433' }, // Redes II requires Redes I
      { course_code: 'INF428', prerequisite_code: 'INF418' }, // Sistemas Expertos requires Inteligencia Artificial
      { course_code: 'INF442', prerequisite_code: 'INF322' }, // Sistema de Información Geográfica requires Base de Datos II

      // 9° SEMESTRE PREREQUISITES
      { course_code: 'INF512', prerequisite_code: 'INF422' }, // Ingeniería de Software II requires Ingeniería de Software I
      { course_code: 'INF513', prerequisite_code: 'INF423' }, // Tecnología Web requires Redes II
      { course_code: 'INF552', prerequisite_code: 'INF512' }, // Arquitectura de Software II requires Ingeniería de Software II

      // 10° SEMESTRE PREREQUISITES
      { course_code: 'GDI001', prerequisite_code: 'INF511' }, // Graduación Directa requires Taller de Grado I
      { course_code: 'GRL001', prerequisite_code: 'INF511' }, // Modalidad de Graduación requires Taller de Grado I
    ];

    for (const rule of prerequisiteRules) {
      const course = courses.find((c) => c.code === rule.course_code);
      const prerequisiteCourse = courses.find(
        (c) => c.code === rule.prerequisite_code,
      );

      if (!course || !prerequisiteCourse) {
        this.logger.warn(
          `Course not found for prerequisite rule: ${rule.prerequisite_code} -> ${rule.course_code}`,
        );
        continue;
      }

      const existingPrerequisite = await this.prerequisiteRepository.findOne({
        where: {
          main_course_id: course.id,
          required_course_id: prerequisiteCourse.id,
        },
      });

      if (!existingPrerequisite) {
        const prerequisiteData = {
          main_course_id: course.id,
          required_course_id: prerequisiteCourse.id,
          kind: 'Prerequisite',
        };

        const prerequisite =
          this.prerequisiteRepository.create(prerequisiteData);
        await this.prerequisiteRepository.save(prerequisite);
        this.logger.log(
          `Created prerequisite: ${rule.prerequisite_code} -> ${rule.course_code}`,
        );
      } else {
        this.logger.log(
          `Prerequisite already exists: ${rule.prerequisite_code} -> ${rule.course_code}`,
        );
      }
    }

    this.logger.log('Prerequisites seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing prerequisites...');
    await this.prerequisiteRepository.createQueryBuilder().delete().execute();
    this.logger.log('Prerequisites cleared');
  }
}
