import { Controller, Get, Query, Param } from '@nestjs/common';
import { AcademicValidationService } from '../services/academic-validation.service';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

/**
 * Controller para consultas de validaciones académicas
 * Permite verificar prerequisitos y validaciones antes de inscripción
 */
@Controller('academic-validations')
export class AcademicValidationController {
  constructor(
    private readonly academicValidationService: AcademicValidationService,
  ) {}

  /**
   * Verificación rápida de prerequisitos para un estudiante y materia
   */
  @Get('prerequisites/check')
  @Auth(ValidRoles.STUDENT, ValidRoles.ADMIN)
  async checkPrerequisites(
    @Query('studentId') studentId: string,
    @Query('courseId') courseId: string,
  ) {
    return await this.academicValidationService.quickPrerequisiteCheck(
      studentId,
      courseId,
    );
  }

  /**
   * Validación académica completa para inscripción
   */
  @Get('enrollment/validate')
  @Auth(ValidRoles.STUDENT, ValidRoles.ADMIN)
  async validateEnrollmentEligibility(
    @Query('studentId') studentId: string,
    @Query('courseSectionId') courseSectionId: string,
    @Query('termId') termId: string,
  ) {
    return await this.academicValidationService.validateEnrollment(
      studentId,
      courseSectionId,
      termId,
    );
  }
}