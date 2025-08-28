import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnrollmentDetail } from '../../enrollments/entities/enrollment-detail.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class EnrollmentDetailSeeder implements SeederInterface {
  constructor(
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
  ) {}

  async run(): Promise<void> {
    console.log('Seeding enrollment details...');

    // Obtener inscripciones activas
    const enrollments = await this.enrollmentRepository.find({
      where: { state: 'Active' },
      relations: ['student', 'term'],
    });

    // Obtener secciones de curso para primer semestre
    const courseSections = await this.courseSectionRepository.find({
      relations: ['course'],
    });

    // Filtrar secciones de primer semestre
    const firstSemesterSections = courseSections.filter(section => 
      ['UNI100', 'FIS100', 'INF110', 'INF119', 'MAT101'].includes(section.course?.code || '')
    );

    if (enrollments.length === 0 || firstSemesterSections.length === 0) {
      console.log('Prerequisites not found for enrollment detail seeding');
      return;
    }

    // Crear detalles de inscripción para cada estudiante
    for (const enrollment of enrollments) {
      // Inscribir en materias de primer semestre (grupo A por defecto)
      const groupASections = firstSemesterSections.filter(section => section.group_label === 'A');
      
      for (const courseSection of groupASections) {
        const existingDetail = await this.enrollmentDetailRepository.findOne({
          where: {
            enrollment_id: enrollment.id,
            course_section_id: courseSection.id,
          },
        });

        if (!existingDetail) {
          const enrollmentDetail = {
            enrollment_id: enrollment.id,
            course_section_id: courseSection.id,
            course_state: 'Enrolled',
            final_grade: undefined,
            attempts: 1,
            closed_on: undefined,
            remark: `Inscrito en ${courseSection.course?.name}`,
          };

          const savedDetail = await this.enrollmentDetailRepository.save(enrollmentDetail);
          
          // Actualizar cupo disponible de la sección
          courseSection.quota_available = Math.max(0, courseSection.quota_available - 1);
          await this.courseSectionRepository.save(courseSection);

          console.log(`Created enrollment detail: ${enrollment.student?.code} -> ${courseSection.course?.code}-${courseSection.group_label}`);
        } else {
          console.log(`Enrollment detail already exists: ${enrollment.student?.code} -> ${courseSection.course?.code}-${courseSection.group_label}`);
        }
      }
    }

    // Crear algunos detalles con calificaciones para semestre anterior
    const previousEnrollments = await this.enrollmentRepository.find({
      where: { state: 'Completed' },
      relations: ['student', 'term'],
    });

    for (const enrollment of previousEnrollments.slice(0, 2)) { // Solo algunos estudiantes
      const sampleSections = firstSemesterSections.slice(0, 3); // Solo 3 materias
      
      for (const courseSection of sampleSections) {
        const existingDetail = await this.enrollmentDetailRepository.findOne({
          where: {
            enrollment_id: enrollment.id,
            course_section_id: courseSection.id,
          },
        });

        if (!existingDetail) {
          const finalGrade = Math.floor(Math.random() * 30) + 51; // Notas entre 51-80
          const enrollmentDetail = {
            enrollment_id: enrollment.id,
            course_section_id: courseSection.id,
            course_state: finalGrade >= 60 ? 'Approved' : 'Failed',
            final_grade: finalGrade,
            attempts: 1,
            closed_on: new Date('2024-12-15'),
            remark: `Semestre anterior - ${finalGrade >= 60 ? 'Aprobado' : 'Reprobado'}`,
          };

          await this.enrollmentDetailRepository.save(enrollmentDetail);
          console.log(`Created completed enrollment detail: ${enrollment.student?.code} -> ${courseSection.course?.code} (${finalGrade})`);
        }
      }
    }

    console.log('Enrollment details seeding completed');
  }

  async clear(): Promise<void> {
    console.log('Clearing enrollment details...');
    await this.enrollmentDetailRepository.delete({});
    console.log('Enrollment details cleared');
  }
}
