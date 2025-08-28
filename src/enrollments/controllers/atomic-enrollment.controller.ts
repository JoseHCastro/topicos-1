import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AtomicEnrollmentService } from '../services';
import { CreateEnrollmentDetailDto } from '../dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('atomic-enrollment')
export class AtomicEnrollmentController {
  constructor(
    private readonly atomicEnrollmentService: AtomicEnrollmentService,
  ) {}

  /**
   * Endpoint principal para inscribir a un estudiante en una sección de curso
   * Maneja control de cupos de forma atómica
   */
  @Post('enroll')
  @HttpCode(HttpStatus.CREATED)
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT)
  async enrollStudent(
    @Body() createEnrollmentDetailDto: CreateEnrollmentDetailDto,
  ) {
    const result = await this.atomicEnrollmentService.enrollStudentInCourseSection(
      createEnrollmentDetailDto,
    );

    return {
      success: true,
      message: 'Inscripción realizada exitosamente',
      data: {
        enrollmentDetail: result.enrollmentDetail,
        remainingQuota: result.remainingQuota,
      },
    };
  }

  /**
   * Obtiene el estado actual de cupos de una sección de curso
   */
  @Get('course-section/:id/quota-status')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  async getQuotaStatus(@Param('id', ParseUUIDPipe) courseSectionId: string) {
    const status = await this.atomicEnrollmentService.getCourseSectionQuotaStatus(
      courseSectionId,
    );

    return {
      success: true,
      data: status,
    };
  }
}