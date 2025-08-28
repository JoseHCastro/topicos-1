import { Index } from 'typeorm';

/**
 * FASE PRE-1D: Decoradores de Índices para Alta Concurrencia
 * 
 * Definición centralizada de índices críticos para optimizar 
 * las consultas del AcademicValidationService bajo alta concurrencia.
 */

// Índices para validación de prerrequisitos
export const PrerequisiteValidationIndexes = {
  // Búsqueda eficiente de prerrequisitos por materia principal
  MAIN_COURSE_LOOKUP: Index(['main_course_id']),
  
  // Búsqueda eficiente de materias requeridas
  REQUIRED_COURSE_LOOKUP: Index(['required_course_id']),
  
  // Índice compuesto para validación completa de prerrequisitos
  PREREQUISITE_VALIDATION: Index(['main_course_id', 'required_course_id', 'kind'])
};

// Índices para detección de conflictos de horario
export const ScheduleConflictIndexes = {
  // Búsqueda por sección de curso
  COURSE_SECTION_LOOKUP: Index(['course_section_id']),
  
  // Índice compuesto para detección de solapamiento de horarios
  TIME_OVERLAP_DETECTION: Index(['course_section_id', 'weekday', 'time_start', 'time_end']),
  
  // Búsqueda por día de la semana y rango horario
  WEEKDAY_TIME_RANGE: Index(['weekday', 'time_start', 'time_end'])
};

// Índices para validación de inscripciones y límites académicos
export const EnrollmentValidationIndexes = {
  // Búsqueda eficiente por estudiante y término
  STUDENT_TERM_LOOKUP: Index(['enrollment_id', 'course_section_id']),
  
  // Índice compuesto para conteo de materias por estudiante/término
  STUDENT_TERM_COUNT: Index(['enrollment_id']),
  
  // Búsqueda por estado de inscripción
  ENROLLMENT_STATUS: Index(['course_state']),
  
  // Índice para fechas de cierre
  CLOSED_DATE_LOOKUP: Index(['closed_on'])
};

// Índices para validación de calificaciones y materias aprobadas
export const GradeValidationIndexes = {
  // Búsqueda eficiente por estudiante
  STUDENT_LOOKUP: Index(['student_id']),
  
  // Búsqueda por sección de curso
  COURSE_SECTION_LOOKUP: Index(['course_section_id']),
  
  // Índice compuesto para validación de materias aprobadas
  APPROVED_COURSES: Index(['student_id', 'course_section_id', 'final_grade']),
  
  // Búsqueda por calificación final
  FINAL_GRADE_LOOKUP: Index(['final_grade'])
};

// Índices para optimización de JOIN operations
export const RelationshipIndexes = {
  // Optimización de JOIN enrollment -> enrollment_detail
  ENROLLMENT_DETAIL_JOIN: Index(['enrollment_id']),
  
  // Optimización de JOIN course_section -> course
  COURSE_SECTION_JOIN: Index(['course_id']),
  
  // Optimización de JOIN course_section -> term
  TERM_JOIN: Index(['term_id']),
  
  // Optimización de JOIN para estudiantes
  STUDENT_JOIN: Index(['student_id'])
};