import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { CourseSection } from '../../teaching/entities/course-section.entity';
import { Student } from '../../auth/entities/student.entity';

@Entity('grade')
@Unique(['course_section_id', 'student_id'])
@Index('IDX_grade_student', ['student_id'])
@Index('IDX_grade_course_section', ['course_section_id'])
@Index('IDX_grade_approved_courses', [
  'student_id',
  'course_section_id',
  'final_grade',
])
@Index('IDX_grade_final_grade', ['final_grade'])
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  course_section_id: string;

  @Column('uuid')
  student_id: string;

  @Column('numeric', { precision: 5, scale: 2, nullable: true })
  final_grade: number;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updated_at: Date;

  @ManyToOne(() => CourseSection)
  @JoinColumn({ name: 'course_section_id' })
  course_section: CourseSection;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
