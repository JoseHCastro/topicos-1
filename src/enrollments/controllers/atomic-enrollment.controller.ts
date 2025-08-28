import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { AtomicEnrollmentService } from '../services';
import { CreateEnrollmentDetailDto } from '../dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';
import { IdempotencyKey } from '../../common/decorators';
import { IdempotencyService } from '../../common/services';

@Controller('atomic-enrollment')
export class AtomicEnrollmentController {
  constructor(
    private readonly atomicEnrollmentService: AtomicEnrollmentService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Endpoint principal para inscribir a un estudiante en una sección de curso
   * Maneja control de cupos de forma atómica con soporte de idempotencia
   */
  @Post('enroll')
  @HttpCode(HttpStatus.CREATED)
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT)
  async enrollStudent(
    @Body() createEnrollmentDetailDto: CreateEnrollmentDetailDto,
    @IdempotencyKey() idempotencyKey: string | null,
  ) {
    // Validar header de idempotencia
    if (!idempotencyKey) {
      throw new BadRequestException(
        'X-Idempotency-Key header is required for enrollment operations',
      );
    }

    // Generar clave única combinando idempotencyKey con datos críticos
    const operationKey = `enroll:${idempotencyKey}:${createEnrollmentDetailDto.enrollment_id}:${createEnrollmentDetailDto.course_section_id}`;

    // Ejecutar con control de idempotencia
    const result = await this.idempotencyService.executeWithIdempotency(
      operationKey,
      async () => {
        return await this.atomicEnrollmentService.enrollStudentInCourseSection(
          createEnrollmentDetailDto,
        );
      },
    );

    return {
      success: true,
      message: result.isNew
        ? 'Inscripción realizada exitosamente'
        : 'Inscripción procesada previamente',
      data: {
        enrollmentDetail: result.data.enrollmentDetail,
        remainingQuota: result.data.remainingQuota,
        isNewOperation: result.isNew,
      },
    };
  }

  /**
   * Obtiene el estado actual de cupos de una sección de curso
   */
  @Get('course-section/:id/quota-status')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  async getQuotaStatus(@Param('id', ParseUUIDPipe) courseSectionId: string) {
    const status = await this.atomicEnrollmentService.getCourseSectionQuotaStatus(
      courseSectionId,
    );

    return {
      success: true,
      data: status,
    };
  }

  /**
   * Obtiene estadísticas del sistema de idempotencia
   */
  @Get('idempotency/stats')
  @Auth(ValidRoles.ADMIN)
  async getIdempotencyStats() {
    const stats = this.idempotencyService.getStats();

    return {
      success: true,
      data: {
        ...stats,
        message: 'Sistema de idempotencia activo',
      },
    };
  }
}