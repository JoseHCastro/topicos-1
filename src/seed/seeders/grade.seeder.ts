import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Grade } from '../../assessments/entities';
import { Student } from '../../auth/entities/student.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class GradeSeeder implements SeederInterface {
  private readonly logger = new Logger(GradeSeeder.name);

  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding grades...');

    const students = await this.studentRepository.find();
    const courseSections = await this.courseSectionRepository.find();

    if (students.length === 0 || courseSections.length === 0) {
      this.logger.warn('Missing required data (students or course sections), skipping grades seeding');
      return;
    }

    const assessmentTypes = ['Midterm1', 'Midterm2', 'Final', 'Assignment1', 'Project'];

    for (const student of students) {
      const selectedSections = this.getRandomSections(courseSections, Math.min(3, courseSections.length));

      for (const courseSection of selectedSections) {
        for (const assessment of assessmentTypes) {
          const existingGrade = await this.gradeRepository.findOne({
            where: {
              course_section_id: courseSection.id,
              student_id: student.id,
              assessment: assessment,
            },
          });

          if (!existingGrade) {
            const score = Math.floor(Math.random() * 100);
            const gradeData = {
              course_section_id: courseSection.id,
              student_id: student.id,
              assessment: assessment,
              weight: this.getAssessmentWeight(assessment),
              score: score,
              recorded_at: new Date(),
            };

            const grade = this.gradeRepository.create(gradeData);
            await this.gradeRepository.save(grade);
            this.logger.log(`Created grade: ${student.first_name} ${student.last_name} - ${assessment}: ${score}`);
          }
        }
      }
    }

    this.logger.log('Grades seeding completed');
  }

  private getRandomSections(courseSections: any[], count: number): any[] {
    const shuffled = [...courseSections].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getAssessmentWeight(assessment: string): number {
    switch (assessment) {
      case 'Midterm1':
      case 'Midterm2':
        return 25.0;
      case 'Final':
        return 40.0;
      case 'Assignment1':
      case 'Project':
        return 5.0;
      default:
        return 10.0;
    }
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing grades...');
    await this.gradeRepository.createQueryBuilder().delete().execute();
    this.logger.log('Grades cleared');
  }
}
