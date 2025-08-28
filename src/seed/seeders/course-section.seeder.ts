import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseSection } from '../../teaching/entities/course-section.entity';
import { Course } from '../../programs/entities/course.entity';
import { Term } from '../../calendar/entities/term.entity';
import { Teacher } from '../../auth/entities/teacher.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class CourseSectionSeeder implements SeederInterface {
  constructor(
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  async run(): Promise<void> {
    console.log('Seeding course sections...');

    const courses = await this.courseRepository.find();
    const currentTerm = await this.termRepository.findOne({ 
      where: { name: '2025-I' } 
    });
    const teacher = await this.teacherRepository.findOne({ 
      where: { email: 'docente@uagrm.edu.bo' }
    });

    if (!currentTerm || !teacher || courses.length === 0) {
      console.log('Prerequisites not found for course sections seeding');
      return;
    }

    const firstSemesterCourses = courses.filter(course => 
      ['UNI100', 'FIS100', 'INF110', 'INF119', 'MAT101'].includes(course.code)
    );

    const courseSectionsData = [
      ...firstSemesterCourses.map(course => ({
        course_id: course.id,
        term_id: currentTerm.id,
        teacher_id: teacher.id,
        group_label: 'A',
        modality: 'Presencial',
        shift: 'Mañana',
        quota_max: 35,
        quota_available: 35,
      })),

      ...firstSemesterCourses.map(course => ({
        course_id: course.id,
        term_id: currentTerm.id,
        teacher_id: teacher.id,
        group_label: 'B',
        modality: 'Presencial',
        shift: 'Tarde',
        quota_max: 35,
        quota_available: 35,
      })),
    ];

    const advancedCourses = courses.filter(course => 
      ['INF120', 'MAT102', 'INF210', 'INF220', 'INF312'].includes(course.code)
    );

    courseSectionsData.push(
      ...advancedCourses.map(course => ({
        course_id: course.id,
        term_id: currentTerm.id,
        teacher_id: teacher.id,
        group_label: 'A',
        modality: 'Presencial',
        shift: 'Mañana',
        quota_max: 30,
        quota_available: 25,
      }))
    );

    for (const sectionData of courseSectionsData) {
      const existingSection = await this.courseSectionRepository.findOne({
        where: {
          course_id: sectionData.course_id,
          term_id: sectionData.term_id,
          group_label: sectionData.group_label,
        },
      });

      if (!existingSection) {
        const courseSection = this.courseSectionRepository.create(sectionData);
        await this.courseSectionRepository.save(courseSection);
        
        const course = courses.find(c => c.id === sectionData.course_id);
        console.log(`Created course section: ${course?.code}-${sectionData.group_label} (${sectionData.shift})`);
      } else {
        const course = courses.find(c => c.id === sectionData.course_id);
        console.log(`Course section already exists: ${course?.code}-${sectionData.group_label}`);
      }
    }

    console.log('Course sections seeding completed');
  }

  async clear(): Promise<void> {
    console.log('Clearing course sections...');
    await this.courseSectionRepository.delete({});
    console.log('Course sections cleared');
  }
}
