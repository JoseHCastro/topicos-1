import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { StudyPlan } from './study-plan.entity';
import { Level } from './level.entity';
import { Prerequisite } from './prerequisite.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';

@Entity('course')
@Unique(['study_plan_id', 'code'])
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  study_plan_id: string;

  @Column('uuid')
  level_id: string;

  @Column('varchar', { length: 20 })
  code: string;

  @Column('varchar', { length: 120 })
  name: string;

  @Column('int')
  credits: number;

  @Column('smallint')
  hours_theory: number;

  @Column('smallint')
  hours_practice: number;

  @Column('varchar', { length: 20 })
  status: string;

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

  @ManyToOne(() => StudyPlan, studyPlan => studyPlan.courses)
  @JoinColumn({ name: 'study_plan_id' })
  study_plan: StudyPlan;

  @ManyToOne(() => Level, level => level.courses)
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @OneToMany(() => Prerequisite, prerequisite => prerequisite.main_course)
  prerequisites_as_main: Prerequisite[];

  @OneToMany(() => Prerequisite, prerequisite => prerequisite.required_course)
  prerequisites_as_required: Prerequisite[];

  @OneToMany(() => CourseSection, courseSection => courseSection.course)
  course_sections: CourseSection[];
}