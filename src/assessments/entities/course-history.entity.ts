import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { Course } from '../../programs/entities/course.entity';
import { Term } from '../../calendar/entities/term.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';

@Entity('course_history')
@Unique(['student_id', 'course_id', 'term_id', 'course_section_id'])
export class CourseHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid')
  course_id: string;

  @Column('uuid')
  term_id: string;

  @Column('uuid')
  course_section_id: string;

  @Column('varchar', { length: 10 })
  result: string; // Approved, Failed

  @Column('numeric', { precision: 5, scale: 2 })
  final_grade: number;

  @Column('date')
  closed_on: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at'
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at'
  })
  updated_at: Date;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Term)
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @ManyToOne(() => CourseSection)
  @JoinColumn({ name: 'course_section_id' })
  course_section: CourseSection;
}