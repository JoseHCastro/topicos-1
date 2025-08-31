import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Excepción para prerequisitos no cumplidos
 */
export class PrerequisiteNotMetException extends HttpException {
  constructor(missingPrerequisites: string[]) {
    const message = `Prerequisitos no cumplidos: ${missingPrerequisites.join(', ')}`;
    super(
      {
        message,
        error: 'Prerequisite Not Met',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        details: {
          type: 'PREREQUISITE_ERROR',
          missingPrerequisites,
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Excepción para conflictos de horario
 */
export class ScheduleConflictException extends HttpException {
  constructor(conflicts: Array<{ course: string; time: string; day: string }>) {
    const message = `Conflictos de horario detectados: ${conflicts.map((c) => `${c.course} (${c.day} ${c.time})`).join(', ')}`;
    super(
      {
        message,
        error: 'Schedule Conflict',
        statusCode: HttpStatus.CONFLICT,
        details: {
          type: 'SCHEDULE_CONFLICT',
          conflicts,
        },
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Excepción para límites académicos excedidos
 */
export class AcademicLimitExceededException extends HttpException {
  constructor(limitType: string, currentValue: number, maxValue: number) {
    const message = `Límite académico excedido: ${limitType}. Actual: ${currentValue}, Máximo: ${maxValue}`;
    super(
      {
        message,
        error: 'Academic Limit Exceeded',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        details: {
          type: 'ACADEMIC_LIMIT_ERROR',
          limitType,
          currentValue,
          maxValue,
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Excepción para materia ya aprobada
 */
export class CourseAlreadyPassedException extends HttpException {
  constructor(courseName: string, grade: number) {
    const message = `La materia ${courseName} ya fue aprobada con calificación ${grade}`;
    super(
      {
        message,
        error: 'Course Already Passed',
        statusCode: HttpStatus.CONFLICT,
        details: {
          type: 'COURSE_ALREADY_PASSED',
          courseName,
          grade,
        },
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Excepción para período de inscripción no activo
 */
export class EnrollmentPeriodClosedException extends HttpException {
  constructor(periodStatus: string, startDate?: Date, endDate?: Date) {
    const message = `Período de inscripción no activo. Estado actual: ${periodStatus}`;
    super(
      {
        message,
        error: 'Enrollment Period Closed',
        statusCode: HttpStatus.FORBIDDEN,
        details: {
          type: 'ENROLLMENT_PERIOD_CLOSED',
          periodStatus,
          startDate,
          endDate,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Excepción para validaciones académicas múltiples
 */
export class MultipleValidationException extends HttpException {
  constructor(errors: string[], warnings: string[] = []) {
    const message = `Múltiples errores de validación académica: ${errors.join('; ')}`;
    super(
      {
        message,
        error: 'Multiple Validation Errors',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        details: {
          type: 'MULTIPLE_VALIDATION_ERROR',
          errors,
          warnings,
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
