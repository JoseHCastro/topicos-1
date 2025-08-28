import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Course } from '../../programs/entities/course.entity';
import { Term } from '../../calendar/entities/term.entity';
import { Teacher } from '../../auth/entities/teacher.entity';
import { Schedule } from './schedule.entity';

@Entity('course_section')
export class CourseSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  course_id: string;

  @Column('uuid')
  term_id: string;

  @Column('uuid')
  teacher_id: string;

  @Column('varchar', { length: 10 })
  group_label: string; // A, B, ...

  @Column('varchar', { length: 20 })
  modality: string; // Onsite, Online

  @Column('varchar', { length: 20 })
  shift: string; // Morning, Afternoon, Evening

  @Column('smallint')
  quota_max: number;

  @Column('smallint')
  quota_available: number;

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

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Term)
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @OneToMany(() => Schedule, schedule => schedule.course_section, { cascade: true })
  schedules: Schedule[];
}