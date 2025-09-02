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
import { Enrollment } from './enrollment.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';

@Entity('enrollment_detail')
@Unique(['enrollment_id', 'course_section_id'])
@Index('IDX_enrollment_detail_enrollment', ['enrollment_id'])
@Index('IDX_enrollment_detail_course_section', ['course_section_id'])
@Index('IDX_enrollment_detail_status', ['course_state'])
@Index('IDX_enrollment_detail_student_term', [
  'enrollment_id',
  'course_section_id',
  'course_state',
])
export class EnrollmentDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: false })
  enrollment_id: string;

  @Column('uuid')
  course_section_id: string;

  @Column('varchar', { length: 20 })
  course_state: string; // Enrolled, Approved, Failed, Withdrawn

  @Column('numeric', { precision: 5, scale: 2, nullable: true })
  final_grade: number;

  @Column('smallint', { default: 1 })
  attempts: number;

  @Column('date', { nullable: true })
  closed_on: Date;

  @Column('varchar', { length: 200, nullable: true })
  remark: string;

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

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.enrollment_details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment;

  @ManyToOne(() => CourseSection)
  @JoinColumn({ name: 'course_section_id' })
  course_section: CourseSection;
}
