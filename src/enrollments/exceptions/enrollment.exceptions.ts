import { HttpException, HttpStatus } from '@nestjs/common';

export class QuotaExceededException extends HttpException {
  constructor(
    courseSectionId: string,
    availableQuota: number,
    message?: string,
  ) {
    const defaultMessage = `No hay cupos disponibles en la sección. Cupos disponibles: ${availableQuota}`;
    super(
      {
        message: message || defaultMessage,
        error: 'Quota Exceeded',
        statusCode: HttpStatus.CONFLICT,
        courseSectionId,
        availableQuota,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class DuplicateEnrollmentException extends HttpException {
  constructor(enrollmentId: string, courseSectionId: string, message?: string) {
    const defaultMessage = 'El estudiante ya está inscrito en esta sección de curso';
    super(
      {
        message: message || defaultMessage,
        error: 'Duplicate Enrollment',
        statusCode: HttpStatus.CONFLICT,
        enrollmentId,
        courseSectionId,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class EnrollmentNotActiveException extends HttpException {
  constructor(enrollmentId: string, currentState: string, message?: string) {
    const defaultMessage = `La inscripción no está activa. Estado actual: ${currentState}`;
    super(
      {
        message: message || defaultMessage,
        error: 'Enrollment Not Active',
        statusCode: HttpStatus.BAD_REQUEST,
        enrollmentId,
        currentState,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}