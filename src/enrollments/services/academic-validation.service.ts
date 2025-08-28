import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Prerequisite } from '../../programs/entities/prerequisite.entity';
import { Schedule } from '../../teaching/entities/schedule.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';
import { EnrollmentDetail } from '../entities/enrollment-detail.entity';
import { Grade } from '../../assessments/entities/grade.entity';
import { TransactionService } from '../../common/services/transaction.service';
import { OptimizedQueryService } from './optimized-query.service';

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
 * FASE PRE-1D: Servicio de validaciones académicas optimizado
 * Utiliza OptimizedQueryService para consultas de alta concurrencia
 * Versión unificada que combina validaciones tradicionales con optimizaciones
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
    
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
    
    private readonly transactionService: TransactionService,
    private readonly optimizedQueryService: OptimizedQueryService,
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
    const results = await Promise.all([
      this.validatePrerequisites(studentId, courseSectionId, manager),
      this.validateScheduleConflicts(studentId, courseSectionId, termId, manager),
      this.validateAcademicLimits(studentId, termId, manager),
      this.validateCourseNotPassed(studentId, courseSectionId, manager)
    ]);

    const result: ValidationResult = {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
      warnings: results.flatMap(r => r.warnings)
    };

    return result;
  }

  /**
   * FASE PRE-1D: Validación optimizada de prerrequisitos
   * Utiliza consultas indexadas para alta concurrencia
   */
  async validatePrerequisites(
    studentId: string,
    courseSectionId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    // Obtener la información de la sección de curso
    const courseSection = await this.courseSectionRepository.findOne({
      where: { id: courseSectionId },
      relations: ['course']
    });

    if (!courseSection) {
      return {
        isValid: false,
        errors: ['Sección de curso no encontrada'],
        warnings: []
      };
    }

    // Usar consulta optimizada para obtener prerrequisitos
    const prerequisites = await this.optimizedQueryService.getPrerequisitesByCourse(
      courseSection.course.id
    );

    if (prerequisites.length === 0) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Verificar prerrequisitos en lote usando consulta optimizada
    const prerequisiteChecks = await this.optimizedQueryService.batchCheckPrerequisites(
      studentId,
      [courseSection.course.id]
    );

    const courseCheck = prerequisiteChecks[0];
    const result: ValidationResult = {
      isValid: courseCheck.hasPrerequisites,
      errors: courseCheck.missingPrerequisites.map(code => 
        `Prerrequisito no cumplido: ${code}`
      ),
      warnings: []
    };

    return result;
  }

  /**
   * FASE PRE-1D: Detección optimizada de conflictos de horario
   * Utiliza índices para consultas eficientes
   */
  async validateScheduleConflicts(
    studentId: string,
    courseSectionId: string,
    termId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    // Obtener horarios de la nueva materia usando consulta optimizada
    const newSchedules = await this.optimizedQueryService.getSchedulesBySections([courseSectionId]);

    if (newSchedules.length === 0) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Obtener detalles de inscripción del estudiante usando consulta optimizada
    const enrolledDetails = await this.optimizedQueryService.getStudentEnrollmentDetails(
      studentId,
      termId
    );

    if (enrolledDetails.length === 0) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Obtener horarios de las materias ya inscritas
    const enrolledSectionIds = enrolledDetails.map(detail => detail.course_section.id);
    const enrolledSchedules = await this.optimizedQueryService.getSchedulesBySections(enrolledSectionIds);

    const conflicts: ScheduleConflict[] = [];

    // Detectar conflictos usando algoritmo optimizado
    for (const newSchedule of newSchedules) {
      for (const existingSchedule of enrolledSchedules) {
        if (this.hasTimeOverlap(newSchedule, existingSchedule)) {
          conflicts.push({
            existingCourseSection: `${existingSchedule.course_section.course.code} - Grupo ${existingSchedule.course_section.group_label}`,
            conflictingTime: `${newSchedule.time_start} - ${newSchedule.time_end}`,
            day: newSchedule.weekday
          });
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      errors: conflicts.map(c => 
        `Conflicto de horario el ${c.day} de ${c.conflictingTime} con ${c.existingCourseSection}`
      ),
      warnings: []
    };
  }

  /**
   * FASE PRE-1D: Validación optimizada de límites académicos
   * Usa conteo eficiente con índices
   */
  async validateAcademicLimits(
    studentId: string,
    termId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    // Usar consulta optimizada para contar materias inscritas
    const enrolledCount = await this.optimizedQueryService.getEnrolledCoursesCount(
      studentId,
      termId
    );

    const MAX_COURSES_PER_TERM = 8; // Límite configurable

    const result: ValidationResult = {
      isValid: enrolledCount < MAX_COURSES_PER_TERM,
      errors: enrolledCount >= MAX_COURSES_PER_TERM ? 
        [`Límite de materias excedido: ${enrolledCount}/${MAX_COURSES_PER_TERM}`] : [],
      warnings: enrolledCount >= MAX_COURSES_PER_TERM - 1 ? 
        [`Cerca del límite de materias: ${enrolledCount}/${MAX_COURSES_PER_TERM}`] : []
    };

    return result;
  }

  /**
   * FASE PRE-1D: Validación optimizada de materias ya aprobadas
   * Usa índice compuesto para búsqueda eficiente
   */
  async validateCourseNotPassed(
    studentId: string,
    courseSectionId: string,
    manager?: EntityManager
  ): Promise<ValidationResult> {
    // Obtener información de la sección de curso
    const courseSection = await this.courseSectionRepository.findOne({
      where: { id: courseSectionId },
      relations: ['course']
    });

    if (!courseSection) {
      return {
        isValid: false,
        errors: ['Sección de curso no encontrada'],
        warnings: []
      };
    }

    // Usar consulta optimizada para verificar si ya aprobó la materia
    const hasPassed = await this.optimizedQueryService.hasStudentPassedCourse(
      studentId,
      courseSection.course.id
    );

    return {
      isValid: !hasPassed,
      errors: hasPassed ? 
        [`Ya aprobó la materia: ${courseSection.course.code} - ${courseSection.course.name}`] : [],
      warnings: []
    };
  }

  /**
   * Función auxiliar para detectar solapamiento de horarios
   */
  private hasTimeOverlap(schedule1: Schedule, schedule2: Schedule): boolean {
    if (schedule1.weekday !== schedule2.weekday) {
      return false;
    }

    const start1 = this.timeToMinutes(schedule1.time_start);
    const end1 = this.timeToMinutes(schedule1.time_end);
    const start2 = this.timeToMinutes(schedule2.time_start);
    const end2 = this.timeToMinutes(schedule2.time_end);

    // Verificar solapamiento: (start1 < end2) && (start2 < end1)
    return start1 < end2 && start2 < end1;
  }

  /**
   * Convierte tiempo HH:MM a minutos para comparación
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Método público para obtener prerrequisitos de una materia (optimizado)
   */
  async getPrerequisitesForCourse(courseId: string): Promise<Prerequisite[]> {
    return this.optimizedQueryService.getPrerequisitesByCourse(courseId);
  }

  /**
   * Método público para verificar prerrequisitos cumplidos (optimizado)
   */
  async checkPrerequisitesCompliance(
    studentId: string,
    courseId: string
  ): Promise<{ courseId: string; hasPrerequisites: boolean; missingPrerequisites: string[] }> {
    const prerequisiteChecks = await this.optimizedQueryService.batchCheckPrerequisites(
      studentId,
      [courseId]
    );
    
    return prerequisiteChecks[0];
  }

  /**
   * Método público para obtener horarios con posibles conflictos (optimizado)
   */
  async getScheduleConflictsForStudent(
    studentId: string,
    termId: string,
    proposedSchedules: { weekday: string; timeStart: string; timeEnd: string }[]
  ): Promise<ScheduleConflict[]> {
    const enrolledDetails = await this.optimizedQueryService.getStudentEnrollmentDetails(
      studentId,
      termId
    );

    if (enrolledDetails.length === 0) {
      return [];
    }

    const enrolledSectionIds = enrolledDetails.map(detail => detail.course_section.id);
    const enrolledSchedules = await this.optimizedQueryService.getSchedulesBySections(enrolledSectionIds);

    const conflicts: ScheduleConflict[] = [];

    for (const proposedSchedule of proposedSchedules) {
      for (const existingSchedule of enrolledSchedules) {
        if (
          proposedSchedule.weekday === existingSchedule.weekday &&
          this.timeToMinutes(proposedSchedule.timeStart) < this.timeToMinutes(existingSchedule.time_end) &&
          this.timeToMinutes(proposedSchedule.timeEnd) > this.timeToMinutes(existingSchedule.time_start)
        ) {
          conflicts.push({
            existingCourseSection: `${existingSchedule.course_section.course.code} - Grupo ${existingSchedule.course_section.group_label}`,
            conflictingTime: `${proposedSchedule.timeStart} - ${proposedSchedule.timeEnd}`,
            day: proposedSchedule.weekday
          });
        }
      }
    }

    return conflicts;
  }
}