import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Check } from 'typeorm';
import { Course } from './course.entity';

@Entity('prerequisite')
@Unique(['main_course_id', 'required_course_id'])
@Check('"main_course_id" <> "required_course_id"')
export class Prerequisite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  main_course_id: string;

  @Column('uuid')
  required_course_id: string;

  @Column('varchar', { length: 20 })
  kind: string; // Prerequisite, Corequisite

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

  @ManyToOne(() => Course, course => course.prerequisites_as_main)
  @JoinColumn({ name: 'main_course_id' })
  main_course: Course;

  @ManyToOne(() => Course, course => course.prerequisites_as_required)
  @JoinColumn({ name: 'required_course_id' })
  required_course: Course;
}