import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { Term } from '../../calendar/entities/term.entity';
import { EnrollmentDetail } from './enrollment-detail.entity';

@Entity('enrollment')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  student_id: string;

  @Column('uuid')
  term_id: string;

  @Column('date')
  enrolled_on: Date;

  @Column('varchar', { length: 20 })
  state: string; // Active, Canceled

  @Column('varchar', { length: 20, nullable: true })
  origin: string; // Regular, Extra

  @Column('varchar', { length: 200, nullable: true })
  note: string;

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

  @ManyToOne(() => Term)
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @OneToMany(() => EnrollmentDetail, detail => detail.enrollment, { cascade: true })
  enrollment_details: EnrollmentDetail[];
}