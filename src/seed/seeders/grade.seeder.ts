import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../../assessments/entities/grade.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';
import { Student } from '../../auth/entities/student.entity';
import { EnrollmentDetail } from '../../enrollments/entities/enrollment-detail.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class GradeSeeder implements SeederInterface {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
  ) {}

  async run(): Promise<void> {
    const completedDetails = await this.enrollmentDetailRepository.find({
      where: { course_state: 'Approved' },
      relations: [
        'enrollment',
        'course_section',
        'enrollment.student',
        'course_section.course',
      ],
    });

    const failedDetails = await this.enrollmentDetailRepository.find({
      where: { course_state: 'Failed' },
      relations: [
        'enrollment',
        'course_section',
        'enrollment.student',
        'course_section.course',
      ],
    });

    const allCompletedDetails = [...completedDetails, ...failedDetails];

    if (allCompletedDetails.length === 0) {
      console.log('No completed enrollment details found for grade seeding');
      return;
    }

    for (const detail of allCompletedDetails) {
      const student = detail.enrollment?.student;
      const courseSection = detail.course_section;

      if (!student || !courseSection) continue;

      const existingGrade = await this.gradeRepository.findOne({
        where: {
          course_section_id: courseSection.id,
          student_id: student.id,
        },
      });

      if (!existingGrade) {
        const finalGrade =
          detail.final_grade || Math.floor(Math.random() * 30) + 51;

        const grade = {
          course_section_id: courseSection.id,
          student_id: student.id,
          final_grade: finalGrade,
        };

        await this.gradeRepository.save(grade);
        console.log(
          `Created grade: ${student.code} -> ${courseSection.course?.code}: ${finalGrade}`,
        );
      } else {
        console.log(
          `Grade already exists: ${student.code} -> ${courseSection.course?.code}`,
        );
      }
    }

    const currentDetails = await this.enrollmentDetailRepository.find({
      where: { course_state: 'Enrolled' },
      relations: [
        'enrollment',
        'course_section',
        'enrollment.student',
        'course_section.course',
      ],
      take: 3,
    });

    for (const detail of currentDetails) {
      const student = detail.enrollment?.student;
      const courseSection = detail.course_section;

      if (!student || !courseSection) continue;

      const existingGrade = await this.gradeRepository.findOne({
        where: {
          course_section_id: courseSection.id,
          student_id: student.id,
        },
      });

      if (!existingGrade) {
        const partialGrade = Math.floor(Math.random() * 40) + 40;

        const grade = {
          course_section_id: courseSection.id,
          student_id: student.id,
          final_grade: partialGrade,
        };

        await this.gradeRepository.save(grade);
        console.log(
          `Created partial grade: ${student.code} -> ${courseSection.course?.code}: ${partialGrade} (partial)`,
        );
      }
    }

    console.log('Grades seeding completed');
  }

  async clear(): Promise<void> {
    console.log('Clearing grades...');
    await this.gradeRepository.delete({});
    console.log('Grades cleared');
  }
}
