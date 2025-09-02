import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../programs/entities/course.entity';
import { StudyPlan } from '../../programs/entities/study-plan.entity';
import { Level } from '../../programs/entities/level.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class CourseSeeder implements SeederInterface {
  private readonly logger = new Logger(CourseSeeder.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(StudyPlan)
    private readonly studyPlanRepository: Repository<StudyPlan>,
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding courses...');

    const studyPlans = await this.studyPlanRepository.find({
      where: { is_current: true },
    });
    const levels = await this.levelRepository.find();

    if (studyPlans.length === 0 || levels.length === 0) {
      this.logger.warn(
        'Missing required data (study plans or levels), skipping courses seeding',
      );
      return;
    }

    const currentPlan = studyPlans[0];

    const courses = [
      // 1° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 1)?.id,
        code: 'UNI100',
        name: 'Inglés Técnico I',
        credits: 3,
        hours_theory: 40,
        hours_practice: 20,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 1)?.id,
        code: 'FIS100',
        name: 'Física I',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 1)?.id,
        code: 'INF110',
        name: 'Introducción a la Informática',
        credits: 3,
        hours_theory: 40,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 1)?.id,
        code: 'INF119',
        name: 'Estructuras Discretas',
        credits: 4,
        hours_theory: 60,
        hours_practice: 20,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 1)?.id,
        code: 'MAT101',
        name: 'Cálculo I',
        credits: 4,
        hours_theory: 80,
        hours_practice: 20,
        status: 'Active',
      },

      // 2° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 2)?.id,
        code: 'UNI101',
        name: 'Inglés Técnico II',
        credits: 3,
        hours_theory: 40,
        hours_practice: 20,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 2)?.id,
        code: 'FIS102',
        name: 'Física II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 2)?.id,
        code: 'INF120',
        name: 'Programación I',
        credits: 5,
        hours_theory: 60,
        hours_practice: 80,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 2)?.id,
        code: 'MAT103',
        name: 'Álgebra Lineal',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 2)?.id,
        code: 'MAT102',
        name: 'Cálculo II',
        credits: 4,
        hours_theory: 80,
        hours_practice: 20,
        status: 'Active',
      },

      // 3° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 3)?.id,
        code: 'ADM100',
        name: 'Administración',
        credits: 3,
        hours_theory: 60,
        hours_practice: 0,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 3)?.id,
        code: 'FISICAOO',
        name: 'Física III',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 3)?.id,
        code: 'INF211',
        name: 'Arquitectura de Computadoras',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 3)?.id,
        code: 'INF210',
        name: 'Programación II',
        credits: 5,
        hours_theory: 60,
        hours_practice: 80,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 3)?.id,
        code: 'MAT207',
        name: 'Ecuaciones Diferenciales',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },

      // 4° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 4)?.id,
        code: 'ADM200',
        name: 'Contabilidad',
        credits: 3,
        hours_theory: 60,
        hours_practice: 0,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 4)?.id,
        code: 'INF221',
        name: 'Programación en Ensamblador',
        credits: 4,
        hours_theory: 40,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 4)?.id,
        code: 'INF220',
        name: 'Estructura de Datos I',
        credits: 5,
        hours_theory: 60,
        hours_practice: 80,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 4)?.id,
        code: 'MAT202',
        name: 'Probabilidades y Estadística',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 4)?.id,
        code: 'MAT205',
        name: 'Métodos Numéricos',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },

      // 5° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 5)?.id,
        code: 'ELC101',
        name: 'Modelado y Simulación de Sistemas',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 5)?.id,
        code: 'INF318',
        name: 'Programación Lógica y Funcional',
        credits: 4,
        hours_theory: 40,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 5)?.id,
        code: 'INF310',
        name: 'Estructura de Datos II',
        credits: 5,
        hours_theory: 60,
        hours_practice: 80,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 5)?.id,
        code: 'INF319',
        name: 'Lenguajes Formales',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 5)?.id,
        code: 'INF312',
        name: 'Base de Datos I',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 5)?.id,
        code: 'MAT302',
        name: 'Probabilidades y Estadística II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },

      // 6° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 6)?.id,
        code: 'ELC104',
        name: 'Procesamiento Digital de Tiempo Real',
        credits: 4,
        hours_theory: 40,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 6)?.id,
        code: 'INF329',
        name: 'Compiladores',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 6)?.id,
        code: 'INF323',
        name: 'Sistemas Operativos I',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 6)?.id,
        code: 'INF322',
        name: 'Base de Datos II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 6)?.id,
        code: 'INF342',
        name: 'Sistema de Información I',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 6)?.id,
        code: 'MAT329',
        name: 'Investigación Operativa',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },

      // 7° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 7)?.id,
        code: 'ELC105',
        name: 'Sistemas Distribuidos',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 7)?.id,
        code: 'INF418',
        name: 'Inteligencia Artificial',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 7)?.id,
        code: 'INF433',
        name: 'Redes I',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 7)?.id,
        code: 'INF413',
        name: 'Sistemas Operativos II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 7)?.id,
        code: 'INF412',
        name: 'Sistema de Información II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 7)?.id,
        code: 'MAT419',
        name: 'Investigación Operativa II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },

      // 8° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 8)?.id,
        code: 'ELC107',
        name: 'Criptografía y Seguridad',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 8)?.id,
        code: 'INF423',
        name: 'Redes II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 8)?.id,
        code: 'INF428',
        name: 'Sistemas Expertos',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 8)?.id,
        code: 'INF422',
        name: 'Ingeniería de Software I',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 8)?.id,
        code: 'INF442',
        name: 'Sistema de Información Geográfica',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 8)?.id,
        code: 'ECO449',
        name: 'Preparación y Evaluación de Proyectos',
        credits: 4,
        hours_theory: 60,
        hours_practice: 40,
        status: 'Active',
      },

      // 9° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 9)?.id,
        code: 'INF511',
        name: 'Taller de Grado I',
        credits: 6,
        hours_theory: 40,
        hours_practice: 120,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 9)?.id,
        code: 'INF512',
        name: 'Ingeniería de Software II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 9)?.id,
        code: 'INF513',
        name: 'Tecnología Web',
        credits: 4,
        hours_theory: 40,
        hours_practice: 80,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 9)?.id,
        code: 'INF552',
        name: 'Arquitectura de Software II',
        credits: 4,
        hours_theory: 60,
        hours_practice: 60,
        status: 'Active',
      },

      // 10° SEMESTRE
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 10)?.id,
        code: 'GDI001',
        name: 'Graduación Directa',
        credits: 8,
        hours_theory: 0,
        hours_practice: 200,
        status: 'Active',
      },
      {
        study_plan_id: currentPlan.id,
        level_id: levels.find((l) => l.order === 10)?.id,
        code: 'GRL001',
        name: 'Modalidad de Graduación',
        credits: 8,
        hours_theory: 0,
        hours_practice: 200,
        status: 'Active',
      },
    ];

    for (const courseData of courses) {
      if (!courseData.study_plan_id || !courseData.level_id) {
        this.logger.warn(
          `Study plan or level not found, skipping course ${courseData.code}`,
        );
        continue;
      }

      const existingCourse = await this.courseRepository.findOne({
        where: {
          study_plan_id: courseData.study_plan_id,
          code: courseData.code,
        },
      });

      if (!existingCourse) {
        const course = this.courseRepository.create(courseData);
        await this.courseRepository.save(course);
        this.logger.log(
          `Created course: ${courseData.code} - ${courseData.name}`,
        );
      } else {
        this.logger.log(
          `Course already exists: ${courseData.code} - ${courseData.name}`,
        );
      }
    }

    this.logger.log('Courses seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing courses...');
    await this.courseRepository.createQueryBuilder().delete().execute();
    this.logger.log('Courses cleared');
  }
}
