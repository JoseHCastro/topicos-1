import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleProtected } from '../../auth/decorators/role-protected.decorator';
import { UserRoleGuard } from '../../auth/guards/user-role.guard';
import { ValidRoles } from '../../auth/interfaces/valid-roles.interface';
import { OptimizedQueryService } from '../services/optimized-query.service';

/**
 * FASE PRE-1D: Controlador para monitoreo de rendimiento de consultas optimizadas
 * Endpoints para verificar eficiencia de índices y consultas de alta concurrencia
 */
@Controller('database-performance')
@UseGuards(AuthGuard(), UserRoleGuard)
export class DatabasePerformanceController {
  constructor(
    private readonly optimizedQueryService: OptimizedQueryService,
  ) {}

  /**
   * Verificar prerrequisitos de una materia con consulta optimizada
   */
  @Get('prerequisites')
  @RoleProtected(ValidRoles.ADMIN)
  async getPrerequisitesPerformance(
    @Query('courseId') courseId: string
  ) {
    const startTime = Date.now();
    
    const prerequisites = await this.optimizedQueryService.getPrerequisitesByCourse(courseId);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      courseId,
      prerequisites: prerequisites.map(p => ({
        id: p.id,
        kind: p.kind,
        requiredCourse: {
          id: p.required_course.id,
          code: p.required_course.code,
          name: p.required_course.name
        }
      })),
      performance: {
        executionTimeMs: executionTime,
        resultCount: prerequisites.length,
        indexUsed: 'IDX_prerequisite_main_course'
      }
    };
  }

  /**
   * Verificar materias aprobadas de un estudiante con consulta optimizada
   */
  @Get('approved-courses')
  @RoleProtected(ValidRoles.ADMIN)
  async getApprovedCoursesPerformance(
    @Query('studentId') studentId: string,
    @Query('courseIds') courseIds: string
  ) {
    const startTime = Date.now();
    
    const courseIdArray = courseIds.split(',');
    const approvedCourses = await this.optimizedQueryService.getApprovedCoursesByStudent(
      studentId,
      courseIdArray
    );
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      studentId,
      courseIds: courseIdArray,
      approvedCourses: approvedCourses.map(grade => ({
        gradeId: grade.id,
        finalGrade: grade.final_grade,
        courseSection: {
          id: grade.course_section.id,
          course: {
            id: grade.course_section.course.id,
            code: grade.course_section.course.code
          }
        }
      })),
      performance: {
        executionTimeMs: executionTime,
        resultCount: approvedCourses.length,
        indexUsed: 'IDX_grade_approved_courses'
      }
    };
  }

  /**
   * Obtener horarios de secciones con consulta optimizada
   */
  @Get('schedules')
  @RoleProtected(ValidRoles.ADMIN)
  async getSchedulesPerformance(
    @Query('courseSectionIds') courseSectionIds: string
  ) {
    const startTime = Date.now();
    
    const sectionIdArray = courseSectionIds.split(',');
    const schedules = await this.optimizedQueryService.getSchedulesBySections(sectionIdArray);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      courseSectionIds: sectionIdArray,
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        courseSectionId: schedule.course_section_id,
        weekday: schedule.weekday,
        timeStart: schedule.time_start,
        timeEnd: schedule.time_end,
        courseSection: {
          groupLabel: schedule.course_section.group_label,
          course: {
            code: schedule.course_section.course.code,
            name: schedule.course_section.course.name
          }
        }
      })),
      performance: {
        executionTimeMs: executionTime,
        resultCount: schedules.length,
        indexUsed: 'IDX_schedule_course_section'
      }
    };
  }

  /**
   * Contar materias inscritas con consulta optimizada
   */
  @Get('enrolled-count')
  @RoleProtected(ValidRoles.ADMIN)
  async getEnrolledCountPerformance(
    @Query('studentId') studentId: string,
    @Query('termId') termId: string
  ) {
    const startTime = Date.now();
    
    const enrolledCount = await this.optimizedQueryService.getEnrolledCoursesCount(
      studentId,
      termId
    );
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      studentId,
      termId,
      enrolledCount,
      performance: {
        executionTimeMs: executionTime,
        indexUsed: 'IDX_enrollment_detail_student_term'
      }
    };
  }

  /**
   * Verificar prerrequisitos en lote con consulta optimizada
   */
  @Get('batch-prerequisites')
  @RoleProtected(ValidRoles.ADMIN)
  async getBatchPrerequisitesPerformance(
    @Query('studentId') studentId: string,
    @Query('courseIds') courseIds: string
  ) {
    const startTime = Date.now();
    
    const courseIdArray = courseIds.split(',');
    const prerequisiteChecks = await this.optimizedQueryService.batchCheckPrerequisites(
      studentId,
      courseIdArray
    );
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      studentId,
      courseIds: courseIdArray,
      prerequisiteChecks,
      performance: {
        executionTimeMs: executionTime,
        resultCount: prerequisiteChecks.length,
        indexesUsed: [
          'IDX_prerequisite_main_course',
          'IDX_grade_approved_courses'
        ]
      }
    };
  }

  /**
   * Verificar si un estudiante ya aprobó una materia con consulta optimizada
   */
  @Get('has-passed')
  @RoleProtected(ValidRoles.ADMIN)
  async getHasPassedPerformance(
    @Query('studentId') studentId: string,
    @Query('courseId') courseId: string
  ) {
    const startTime = Date.now();
    
    const hasPassed = await this.optimizedQueryService.hasStudentPassedCourse(
      studentId,
      courseId
    );
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      studentId,
      courseId,
      hasPassed,
      performance: {
        executionTimeMs: executionTime,
        indexUsed: 'IDX_grade_approved_courses'
      }
    };
  }

  /**
   * Obtener detalles de inscripción del estudiante con consulta optimizada
   */
  @Get('student-enrollment-details')
  @RoleProtected(ValidRoles.ADMIN)
  async getStudentEnrollmentDetailsPerformance(
    @Query('studentId') studentId: string,
    @Query('termId') termId: string
  ) {
    const startTime = Date.now();
    
    const enrollmentDetails = await this.optimizedQueryService.getStudentEnrollmentDetails(
      studentId,
      termId
    );
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      studentId,
      termId,
      enrollmentDetails: enrollmentDetails.map(detail => ({
        id: detail.id,
        courseState: detail.course_state,
        courseSection: {
          id: detail.course_section.id,
          groupLabel: detail.course_section.group_label,
          course: {
            id: detail.course_section.course.id,
            code: detail.course_section.course.code,
            name: detail.course_section.course.name,
            credits: detail.course_section.course.credits
          }
        }
      })),
      performance: {
        executionTimeMs: executionTime,
        resultCount: enrollmentDetails.length,
        indexUsed: 'IDX_enrollment_detail_student_term'
      }
    };
  }
}