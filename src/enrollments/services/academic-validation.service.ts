import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Prerequisite } from '../../programs/entities/prerequisite.entity';
import { Schedule } from '../../teaching/entities/schedule.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';
import { EnrollmentDetail } from '../entities/enrollment-detail.entity';
import { Grade } from '../../assessments/entities/grade.entity';
import { TransactionService } from '../../common/services/transaction.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScheduleConflict {
  existingCourseSection: string;
  conflictingTime: string;
  day: string;
}

/**
 * Servicio de validaciones académicas para inscripciones
 * Maneja prerequisitos, conflictos de horario y límites académicos
 */
@Injectable()
export class AcademicValidationService {
  constructor(
    @InjectRepository(Prerequisite)
    private readonly prerequisiteRepository: Repository<Prerequisite>,
    
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
    
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Validación completa antes de inscribir a un estudiante en una materia
   */
  async validateEnrollment(
    studentId: string,
    courseSectionId: string,
    termId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Ejecutar todas las validaciones
    const validations = await Promise.allSettled([
      this.validatePrerequisites(studentId, courseSectionId, manager),
      this.validateScheduleConflicts(studentId, courseSectionId, termId, manager),
      this.validateAcademicLimits(studentId, termId, manager),
      this.validateCourseNotPassed(studentId, courseSectionId, manager)
    ]);

    // Procesar resultados de validaciones
    validations.forEach((validation, index) => {
      if (validation.status === 'rejected') {
        result.isValid = false;
        result.errors.push(validation.reason.message || 'Error en validación académica');
      } else if (validation.value && !validation.value.isValid) {
        result.isValid = false;
        result.errors.push(...validation.value.errors);
        result.warnings.push(...validation.value.warnings);
      }
    });

    return result;
  }

  /**
   * Valida que el estudiante tenga aprobados todos los prerequisitos
   */
  async validatePrerequisites(
    studentId: string,
    courseSectionId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    const repo = manager ? manager.getRepository(Prerequisite) : this.prerequisiteRepository;
    const gradeRepo = manager ? manager.getRepository(Grade) : this.gradeRepository;
    
    // Obtener prerequisitos de la materia
    const prerequisites = await repo
      .createQueryBuilder('p')
      .innerJoin('p.main_course', 'mc')
      .innerJoin('course_section', 'cs', 'cs.course_id = mc.id')
      .innerJoin('p.required_course', 'rc')
      .where('cs.id = :courseSectionId', { courseSectionId })
      .select(['p.id', 'rc.code', 'rc.name', 'p.kind'])
      .getMany();

    if (prerequisites.length === 0) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Verificar cada prerequisito
    for (const prerequisite of prerequisites) {
      const passingGrade = await gradeRepo
        .createQueryBuilder('g')
        .innerJoin('g.course_section', 'cs')
        .innerJoin('cs.course', 'c')
        .where('g.student_id = :studentId', { studentId })
        .andWhere('c.id = :courseId', { courseId: prerequisite.required_course.id })
        .andWhere('g.final_grade >= 60') // Nota mínima de aprobación
        .getOne();

      if (!passingGrade) {
        result.isValid = false;
        result.errors.push(
          `Prerequisito no cumplido: ${prerequisite.required_course.name} (${prerequisite.required_course.code})`
        );
      }
    }

    return result;
  }

  /**
   * Detecta conflictos de horario con materias ya inscritas
   */
  async validateScheduleConflicts(
    studentId: string,
    courseSectionId: string,
    termId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    const scheduleRepo = manager ? manager.getRepository(Schedule) : this.scheduleRepository;
    const enrollmentRepo = manager ? manager.getRepository(EnrollmentDetail) : this.enrollmentDetailRepository;

    // Obtener horarios de la nueva materia
    const newSchedules = await scheduleRepo
      .createQueryBuilder('s')
      .where('s.course_section_id = :courseSectionId', { courseSectionId })
      .getMany();

    // Obtener materias ya inscritas en el período
    const enrolledSections = await enrollmentRepo
      .createQueryBuilder('ed')
      .innerJoin('ed.enrollment', 'e')
      .innerJoin('ed.course_section', 'cs')
      .where('e.student_id = :studentId', { studentId })
      .andWhere('cs.term_id = :termId', { termId })
      .andWhere('ed.status = :status', { status: 'enrolled' })
      .select(['cs.id'])
      .getMany();

    if (enrolledSections.length === 0) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const enrolledSectionIds = enrolledSections.map(es => es.course_section.id);

    // Obtener horarios de materias inscritas
    const existingSchedules = await scheduleRepo
      .createQueryBuilder('s')
      .innerJoin('s.course_section', 'cs')
      .innerJoin('cs.course', 'c')
      .where('s.course_section_id IN (:...sectionIds)', { sectionIds: enrolledSectionIds })
      .select([
        's.weekday',
        's.time_start',
        's.time_end',
        'cs.id',
        'c.name',
        'c.code'
      ])
      .getMany();

    const conflicts: ScheduleConflict[] = [];

    // Detectar conflictos
    for (const newSchedule of newSchedules) {
      for (const existingSchedule of existingSchedules) {
        if (newSchedule.weekday === existingSchedule.weekday) {
          // Verificar overlap de tiempo
          if (this.hasTimeOverlap(
            newSchedule.time_start,
            newSchedule.time_end,
            existingSchedule.time_start,
            existingSchedule.time_end
          )) {
            conflicts.push({
              existingCourseSection: `${existingSchedule.course_section.course.name} (${existingSchedule.course_section.course.code})`,
              conflictingTime: `${existingSchedule.time_start} - ${existingSchedule.time_end}`,
              day: existingSchedule.weekday
            });
          }
        }
      }
    }

    const result: ValidationResult = {
      isValid: conflicts.length === 0,
      errors: [],
      warnings: []
    };

    if (conflicts.length > 0) {
      result.errors = conflicts.map(conflict => 
        `Conflicto de horario el ${conflict.day}: ${conflict.existingCourseSection} (${conflict.conflictingTime})`
      );
    }

    return result;
  }

  /**
   * Valida límites académicos (carga mínima/máxima)
   */
  async validateAcademicLimits(
    studentId: string,
    termId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    const enrollmentRepo = manager ? manager.getRepository(EnrollmentDetail) : this.enrollmentDetailRepository;

    // Contar materias inscritas en el período
    const enrolledCount = await enrollmentRepo
      .createQueryBuilder('ed')
      .innerJoin('ed.enrollment', 'e')
      .innerJoin('ed.course_section', 'cs')
      .where('e.student_id = :studentId', { studentId })
      .andWhere('cs.term_id = :termId', { termId })
      .andWhere('ed.status = :status', { status: 'enrolled' })
      .getCount();

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Límites de carga académica
    const MAX_COURSES_PER_TERM = 8;
    const MIN_COURSES_FOR_FULLTIME = 4;

    if (enrolledCount >= MAX_COURSES_PER_TERM) {
      result.isValid = false;
      result.errors.push(`Límite máximo de materias excedido (${MAX_COURSES_PER_TERM} materias por período)`);
    }

    if (enrolledCount === 0) {
      result.warnings.push(`Se recomienda inscribir al menos ${MIN_COURSES_FOR_FULLTIME} materias para mantener estatus de estudiante tiempo completo`);
    }

    return result;
  }

  /**
   * Verifica que el estudiante no haya aprobado ya la materia
   */
  async validateCourseNotPassed(
    studentId: string,
    courseSectionId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    const gradeRepo = manager ? manager.getRepository(Grade) : this.gradeRepository;

    // Verificar si ya aprobó la materia
    const passingGrade = await gradeRepo
      .createQueryBuilder('g')
      .innerJoin('g.course_section', 'cs')
      .innerJoin('cs.course', 'c')
      .innerJoin('course_section', 'current_cs', 'current_cs.id = :courseSectionId', { courseSectionId })
      .innerJoin('current_cs.course', 'current_c')
      .where('g.student_id = :studentId', { studentId })
      .andWhere('c.id = current_c.id') // Misma materia
      .andWhere('g.final_grade >= 60') // Nota aprobatoria
      .getOne();

    const result: ValidationResult = {
      isValid: !passingGrade,
      errors: [],
      warnings: []
    };

    if (passingGrade) {
      result.errors.push('El estudiante ya ha aprobado esta materia previamente');
    }

    return result;
  }

  /**
   * Utilidad para detectar overlap de tiempo
   */
  private hasTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    // Convertir strings de tiempo a minutos desde medianoche
    const parseTime = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const s1 = parseTime(start1);
    const e1 = parseTime(end1);
    const s2 = parseTime(start2);
    const e2 = parseTime(end2);

    // Verificar overlap: start1 < end2 AND start2 < end1
    return s1 < e2 && s2 < e1;
  }

  /**
   * Validación rápida solo de prerequisitos (para UI)
   */
  async quickPrerequisiteCheck(
    studentId: string,
    courseId: string
  ): Promise<{ canEnroll: boolean; missingPrerequisites: string[] }> {
    const prerequisites = await this.prerequisiteRepository
      .createQueryBuilder('p')
      .innerJoin('p.required_course', 'rc')
      .where('p.main_course_id = :courseId', { courseId })
      .select(['rc.code', 'rc.name'])
      .getMany();

    if (prerequisites.length === 0) {
      return { canEnroll: true, missingPrerequisites: [] };
    }

    const missingPrerequisites: string[] = [];

    for (const prerequisite of prerequisites) {
      const passingGrade = await this.gradeRepository
        .createQueryBuilder('g')
        .innerJoin('g.course_section', 'cs')
        .innerJoin('cs.course', 'c')
        .where('g.student_id = :studentId', { studentId })
        .andWhere('c.id = :courseId', { courseId: prerequisite.required_course.id })
        .andWhere('g.final_grade >= 60')
        .getOne();

      if (!passingGrade) {
        missingPrerequisites.push(`${prerequisite.required_course.name} (${prerequisite.required_course.code})`);
      }
    }

    return {
      canEnroll: missingPrerequisites.length === 0,
      missingPrerequisites
    };
  }
}