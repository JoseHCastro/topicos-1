import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { TransactionService } from '../../common';
import { Enrollment, EnrollmentDetail } from '../entities';
import { CourseSection } from '../../teaching/entities';
import { CreateEnrollmentDetailDto } from '../dto';
import {
  QuotaExceededException,
  DuplicateEnrollmentException,
  EnrollmentNotActiveException,
} from '../exceptions';
import { AcademicValidationService } from './academic-validation.service';
import { MultipleValidationException } from '../exceptions/academic-validation.exceptions';

export interface EnrollmentResult {
  enrollmentDetail: EnrollmentDetail;
  remainingQuota: number;
  wasCreated: boolean;
}

@Injectable()
export class AtomicEnrollmentService {
  private readonly logger = new Logger(AtomicEnrollmentService.name);

  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
    private readonly transactionService: TransactionService,
    private readonly academicValidationService: AcademicValidationService,
  ) {}

  /**
   * Inscribe a un estudiante en una sección de curso de forma atómica
   * Controla cupos y previene inscripciones duplicadas
   */
  async enrollStudentInCourseSection(
    createEnrollmentDetailDto: CreateEnrollmentDetailDto,
  ): Promise<EnrollmentResult> {
    this.logger.log(
      `Iniciando inscripción: Enrollment ${createEnrollmentDetailDto.enrollment_id} -> CourseSection ${createEnrollmentDetailDto.course_section_id}`,
    );

    return await this.transactionService.executeWithRetry(
      async (manager: EntityManager) => {
        const enrollment = await this.validateEnrollmentExists(
          manager,
          createEnrollmentDetailDto.enrollment_id,
        );

        const courseSection = await this.getCourseSectionWithLock(
          manager,
          createEnrollmentDetailDto.course_section_id,
        );

        await this.validateNoDuplicateEnrollment(
          manager,
          createEnrollmentDetailDto.enrollment_id,
          createEnrollmentDetailDto.course_section_id,
        );

        await this.performAcademicValidations(
          manager,
          enrollment,
          courseSection,
        );

        this.validateQuotaAvailable(courseSection);

        const enrollmentDetail = await this.createEnrollmentDetail(
          manager,
          createEnrollmentDetailDto,
        );

        const updatedCourseSection = await this.decrementQuota(
          manager,
          courseSection,
        );

        this.logger.log(
          `Inscripción exitosa: Student en CourseSection ${courseSection.id}, cupos restantes: ${updatedCourseSection.quota_available}`,
        );

        return {
          enrollmentDetail,
          remainingQuota: updatedCourseSection.quota_available,
          wasCreated: true,
        };
      },
      3,
      10000,
    );
  }

  /**
   * Verifica que la inscripción (enrollment) existe y está activa
   */
  private async validateEnrollmentExists(
    manager: EntityManager,
    enrollmentId: string,
  ): Promise<Enrollment> {
    const enrollment = await manager.findOne(Enrollment, {
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Inscripción con ID ${enrollmentId} no encontrada`,
      );
    }

    if (enrollment.state !== 'Active') {
      throw new EnrollmentNotActiveException(
        enrollmentId,
        enrollment.state,
        `La inscripción ${enrollmentId} no está activa (estado: ${enrollment.state})`,
      );
    }

    return enrollment;
  }

  /**
   * Obtiene la sección del curso con lock pesimista para evitar condiciones de carrera
   */
  private async getCourseSectionWithLock(
    manager: EntityManager,
    courseSectionId: string,
  ): Promise<CourseSection> {
    const courseSection = await manager.findOne(CourseSection, {
      where: { id: courseSectionId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!courseSection) {
      throw new NotFoundException(
        `Sección de curso con ID ${courseSectionId} no encontrada`,
      );
    }

    return courseSection;
  }

  /**
   * Verifica que no existe una inscripción duplicada
   */
  private async validateNoDuplicateEnrollment(
    manager: EntityManager,
    enrollmentId: string,
    courseSectionId: string,
  ): Promise<void> {
    const existingDetail = await manager.findOne(EnrollmentDetail, {
      where: {
        enrollment_id: enrollmentId,
        course_section_id: courseSectionId,
      },
    });

    if (existingDetail) {
      throw new DuplicateEnrollmentException(
        enrollmentId,
        courseSectionId,
        `El estudiante ya está inscrito en esta sección de curso`,
      );
    }
  }

  /**
   * Verifica que hay cupos disponibles
   */
  private validateQuotaAvailable(courseSection: CourseSection): void {
    if (courseSection.quota_available <= 0) {
      throw new QuotaExceededException(
        courseSection.id,
        courseSection.quota_available,
        `No hay cupos disponibles en la sección ${courseSection.group_label}. Cupos disponibles: ${courseSection.quota_available}`,
      );
    }
  }

  /**
   * Crea el detalle de inscripción
   */
  private async createEnrollmentDetail(
    manager: EntityManager,
    createEnrollmentDetailDto: CreateEnrollmentDetailDto,
  ): Promise<EnrollmentDetail> {
    const enrollmentDetail = manager.create(EnrollmentDetail, {
      ...createEnrollmentDetailDto,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return await manager.save(EnrollmentDetail, enrollmentDetail);
  }

  /**
   * Reduce el cupo disponible de forma atómica
   */
  private async decrementQuota(
    manager: EntityManager,
    courseSection: CourseSection,
  ): Promise<CourseSection> {
    const result = await manager
      .createQueryBuilder()
      .update(CourseSection)
      .set({
        quota_available: () => 'quota_available - 1',
        updated_at: new Date(),
      })
      .where('id = :id', { id: courseSection.id })
      .andWhere('quota_available > 0')
      .execute();

    if (result.affected === 0) {
      throw new QuotaExceededException(
        courseSection.id,
        0,
        'No se pudo reducir el cupo. Posiblemente no hay cupos disponibles.',
      );
    }

    const updatedCourseSection = await manager.findOne(CourseSection, {
      where: { id: courseSection.id },
    });

    return updatedCourseSection!;
  }

  /**
   * Obtiene el estado actual de cupos de una sección de curso
   */
  async getCourseSectionQuotaStatus(courseSectionId: string): Promise<{
    quota_max: number;
    quota_available: number;
    quota_used: number;
    is_full: boolean;
  }> {
    const courseSection = await this.courseSectionRepository.findOne({
      where: { id: courseSectionId },
    });

    if (!courseSection) {
      throw new NotFoundException(
        `Sección de curso con ID ${courseSectionId} no encontrada`,
      );
    }

    const quota_used = courseSection.quota_max - courseSection.quota_available;

    return {
      quota_max: courseSection.quota_max,
      quota_available: courseSection.quota_available,
      quota_used,
      is_full: courseSection.quota_available <= 0,
    };
  }

  /**
   * Realiza todas las validaciones académicas antes de la inscripción
   */
  private async performAcademicValidations(
    manager: EntityManager,
    enrollment: Enrollment,
    courseSection: CourseSection,
  ): Promise<void> {
    this.logger.log(
      `Iniciando validaciones académicas para Student ${enrollment.student.id} en CourseSection ${courseSection.id}`,
    );

    const validationResult =
      await this.academicValidationService.validateEnrollment(
        enrollment.student.id,
        courseSection.id,
        courseSection.term_id,
        manager,
      );

    if (!validationResult.isValid) {
      this.logger.warn(
        `Validaciones académicas fallidas para Student ${enrollment.student.id}: ${validationResult.errors.join('; ')}`,
      );

      throw new MultipleValidationException(
        validationResult.errors,
        validationResult.warnings,
      );
    }

    if (validationResult.warnings.length > 0) {
      this.logger.warn(
        `Advertencias académicas para Student ${enrollment.student.id}: ${validationResult.warnings.join('; ')}`,
      );
    }

    this.logger.log(
      `Validaciones académicas exitosas para Student ${enrollment.student.id}`,
    );
  }
}
