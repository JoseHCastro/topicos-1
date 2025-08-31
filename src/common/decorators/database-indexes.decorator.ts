import { Index } from 'typeorm';

/**
 * FASE PRE-1D: Decoradores de Índices para Alta Concurrencia
 *
 * Definición centralizada de índices críticos para optimizar
 * las consultas del AcademicValidationService bajo alta concurrencia.
 */

export const PrerequisiteValidationIndexes = {
  MAIN_COURSE_LOOKUP: Index(['main_course_id']),

  REQUIRED_COURSE_LOOKUP: Index(['required_course_id']),

  PREREQUISITE_VALIDATION: Index([
    'main_course_id',
    'required_course_id',
    'kind',
  ]),
};

export const ScheduleConflictIndexes = {
  COURSE_SECTION_LOOKUP: Index(['course_section_id']),

  TIME_OVERLAP_DETECTION: Index([
    'course_section_id',
    'weekday',
    'time_start',
    'time_end',
  ]),

  WEEKDAY_TIME_RANGE: Index(['weekday', 'time_start', 'time_end']),
};

export const EnrollmentValidationIndexes = {
  STUDENT_TERM_LOOKUP: Index(['enrollment_id', 'course_section_id']),

  STUDENT_TERM_COUNT: Index(['enrollment_id']),

  ENROLLMENT_STATUS: Index(['course_state']),

  CLOSED_DATE_LOOKUP: Index(['closed_on']),
};

export const GradeValidationIndexes = {
  STUDENT_LOOKUP: Index(['student_id']),

  COURSE_SECTION_LOOKUP: Index(['course_section_id']),

  APPROVED_COURSES: Index(['student_id', 'course_section_id', 'final_grade']),

  FINAL_GRADE_LOOKUP: Index(['final_grade']),
};

export const RelationshipIndexes = {
  ENROLLMENT_DETAIL_JOIN: Index(['enrollment_id']),

  COURSE_SECTION_JOIN: Index(['course_id']),

  TERM_JOIN: Index(['term_id']),

  STUDENT_JOIN: Index(['student_id']),
};
