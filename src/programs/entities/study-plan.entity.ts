import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DegreeProgram } from './degree-program.entity';
import { Course } from './course.entity';

@Entity('study_plan')
export class StudyPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  degree_program_id: string;

  @Column('varchar', { length: 20 })
  version: string;

  @Column('boolean', { default: false })
  is_current: boolean;

  @Column('date')
  valid_from: Date;

  @Column('date', { nullable: true })
  valid_to: Date;

  @Column('varchar', { length: 50, nullable: true })
  resolution: string;

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

  @ManyToOne(() => DegreeProgram, (degreeProgram) => degreeProgram.study_plans)
  @JoinColumn({ name: 'degree_program_id' })
  degree_program: DegreeProgram;

  @OneToMany(() => Course, (course) => course.study_plan)
  courses: Course[];
}
