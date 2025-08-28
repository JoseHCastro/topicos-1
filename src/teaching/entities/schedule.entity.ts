import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { CourseSection } from './course-section.entity';
import { Classroom } from '../../facilities/entities/classroom.entity';

@Entity('schedule')
@Index('IDX_schedule_course_section', ['course_section_id'])
@Index('IDX_schedule_time_overlap', ['course_section_id', 'weekday', 'time_start', 'time_end'])
@Index('IDX_schedule_weekday_time', ['weekday', 'time_start', 'time_end'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: false })
  course_section_id: string;

  @Column('uuid')
  classroom_id: string;

  @Column('varchar', { length: 10 })
  weekday: string; // MON, TUE, ...

  @Column('time')
  time_start: string;

  @Column('time')
  time_end: string;

  @Column('date', { nullable: true })
  date_start: Date;

  @Column('date', { nullable: true })
  date_end: Date;

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

  @ManyToOne(() => CourseSection, courseSection => courseSection.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_section_id' })
  course_section: CourseSection;

  @ManyToOne(() => Classroom)
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom;
}