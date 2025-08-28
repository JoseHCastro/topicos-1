import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../../assessments/entities/grade.entity';
import { Prerequisite } from '../../programs/entities/prerequisite.entity';
import { Schedule } from '../../teaching/entities/schedule.entity';
import { EnrollmentDetail } from '../entities/enrollment-detail.entity';

/**
 * FASE PRE-1D: Servicio de Consultas Optimizadas
 * 
 * Servicio especializado que aprovecha los índices definidos para
 * ejecutar consultas de alta concurrencia de manera eficiente.
 */

@Injectable()
export class OptimizedQueryService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(Prerequisite)
    private readonly prerequisiteRepository: Repository<Prerequisite>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
  ) {}

  /**
   * Consulta optimizada para obtener prerrequisitos de una materia
   * Utiliza IDX_prerequisite_main_course
   */
  async getPrerequisitesByCourse(courseId: string): Promise<Prerequisite[]> {
    return this.prerequisiteRepository
      .createQueryBuilder('p')
      .select([
        'p.id',
        'p.kind',
        'rc.id',
        'rc.code',
        'rc.name'
      ])
      .innerJoin('p.required_course', 'rc')
      .where('p.main_course_id = :courseId', { courseId })
      .orderBy('p.kind', 'ASC')
      .addOrderBy('rc.code', 'ASC')
      .getMany();
  }

  /**
   * Consulta optimizada para verificar materias aprobadas por estudiante
   * Utiliza IDX_grade_approved_courses
   */
  async getApprovedCoursesByStudent(studentId: string, courseIds: string[]): Promise<Grade[]> {
    return this.gradeRepository
      .createQueryBuilder('g')
      .select([
        'g.id',
        'g.final_grade',
        'cs.id',
        'c.id',
        'c.code'
      ])
      .innerJoin('g.course_section', 'cs')
      .innerJoin('cs.course', 'c')
      .where('g.student_id = :studentId', { studentId })
      .andWhere('c.id IN (:...courseIds)', { courseIds })
      .andWhere('g.final_grade >= 60')
      .getMany();
  }

  /**
   * Consulta optimizada para detectar conflictos de horario
   * Utiliza IDX_schedule_time_overlap
   */
  async getScheduleConflicts(
    courseSectionIds: string[],
    weekday: string,
    timeStart: string,
    timeEnd: string
  ): Promise<Schedule[]> {
    return this.scheduleRepository
      .createQueryBuilder('s')
      .select([
        's.id',
        's.course_section_id',
        's.weekday',
        's.time_start',
        's.time_end',
        'cs.group_label',
        'c.code',
        'c.name'
      ])
      .innerJoin('s.course_section', 'cs')
      .innerJoin('cs.course', 'c')
      .where('s.course_section_id IN (:...courseSectionIds)', { courseSectionIds })
      .andWhere('s.weekday = :weekday', { weekday })
      .andWhere(`
        (s.time_start < :timeEnd AND s.time_end > :timeStart)
      `, { timeStart, timeEnd })
      .orderBy('s.time_start', 'ASC')
      .getMany();
  }

  /**
   * Consulta optimizada para contar materias inscritas por estudiante y término
   * Utiliza IDX_enrollment_detail_student_term
   */
  async getEnrolledCoursesCount(studentId: string, termId: string): Promise<number> {
    const result = await this.enrollmentDetailRepository
      .createQueryBuilder('ed')
      .select('COUNT(*)', 'count')
      .innerJoin('ed.enrollment', 'e')
      .innerJoin('ed.course_section', 'cs')
      .where('e.student_id = :studentId', { studentId })
      .andWhere('cs.term_id = :termId', { termId })
      .andWhere('ed.course_state = :status', { status: 'enrolled' })
      .getRawOne();

    return parseInt(result.count, 10);
  }

  /**
   * Consulta optimizada para obtener detalles de inscripción del estudiante en un término
   * Utiliza IDX_enrollment_detail_student_term
   */
  async getStudentEnrollmentDetails(studentId: string, termId: string): Promise<EnrollmentDetail[]> {
    return this.enrollmentDetailRepository
      .createQueryBuilder('ed')
      .select([
        'ed.id',
        'ed.course_state',
        'cs.id',
        'cs.group_label',
        'c.id',
        'c.code',
        'c.name',
        'c.credits'
      ])
      .innerJoin('ed.enrollment', 'e')
      .innerJoin('ed.course_section', 'cs')
      .innerJoin('cs.course', 'c')
      .where('e.student_id = :studentId', { studentId })
      .andWhere('cs.term_id = :termId', { termId })
      .andWhere('ed.course_state = :status', { status: 'enrolled' })
      .orderBy('c.code', 'ASC')
      .getMany();
  }

  /**
   * Consulta optimizada para obtener horarios de secciones específicas
   * Utiliza IDX_schedule_course_section
   */
  async getSchedulesBySections(courseSectionIds: string[]): Promise<Schedule[]> {
    return this.scheduleRepository
      .createQueryBuilder('s')
      .select([
        's.id',
        's.course_section_id',
        's.weekday',
        's.time_start',
        's.time_end',
        'cs.group_label',
        'c.code',
        'c.name'
      ])
      .innerJoin('s.course_section', 'cs')
      .innerJoin('cs.course', 'c')
      .where('s.course_section_id IN (:...courseSectionIds)', { courseSectionIds })
      .orderBy('s.weekday', 'ASC')
      .addOrderBy('s.time_start', 'ASC')
      .getMany();
  }

  /**
   * Consulta optimizada para verificar si un estudiante ya aprobó una materia específica
   * Utiliza IDX_grade_approved_courses
   */
  async hasStudentPassedCourse(studentId: string, courseId: string): Promise<boolean> {
    const grade = await this.gradeRepository
      .createQueryBuilder('g')
      .select('g.id')
      .innerJoin('g.course_section', 'cs')
      .innerJoin('cs.course', 'c')
      .where('g.student_id = :studentId', { studentId })
      .andWhere('c.id = :courseId', { courseId })
      .andWhere('g.final_grade >= 60')
      .getOne();

    return !!grade;
  }

  /**
   * Consulta optimizada en lote para verificar múltiples prerrequisitos
   * Minimiza las consultas utilizando operaciones IN con índices
   */
  async batchCheckPrerequisites(
    studentId: string,
    courseIds: string[]
  ): Promise<{ courseId: string; hasPrerequisites: boolean; missingPrerequisites: string[] }[]> {
    // Obtener todos los prerrequisitos de las materias en una sola consulta
    const prerequisites = await this.prerequisiteRepository
      .createQueryBuilder('p')
      .select([
        'p.main_course_id',
        'p.required_course_id',
        'rc.code'
      ])
      .innerJoin('p.required_course', 'rc')
      .where('p.main_course_id IN (:...courseIds)', { courseIds })
      .getMany();

    // Obtener todas las materias aprobadas del estudiante en una sola consulta
    const allRequiredCourseIds = prerequisites.map(p => p.required_course_id);
    const approvedGrades = await this.getApprovedCoursesByStudent(studentId, allRequiredCourseIds);
    const approvedCourseIds = new Set(
      approvedGrades.map(g => g.course_section.course.id)
    );

    // Procesar resultados por materia
    return courseIds.map(courseId => {
      const coursePrerequisites = prerequisites.filter(p => p.main_course_id === courseId);
      
      if (coursePrerequisites.length === 0) {
        return {
          courseId,
          hasPrerequisites: true,
          missingPrerequisites: []
        };
      }

      const missingPrerequisites = coursePrerequisites
        .filter(p => !approvedCourseIds.has(p.required_course_id))
        .map(p => p.required_course.code);

      return {
        courseId,
        hasPrerequisites: missingPrerequisites.length === 0,
        missingPrerequisites
      };
    });
  }
}