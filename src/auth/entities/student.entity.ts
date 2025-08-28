import { ChildEntity, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';

@ChildEntity()
export class Student extends User {
  @Column('varchar', { length: 30, unique: true })
  code: string;

  @Column('date')
  enrolled_at: Date;

  @Column('date', { nullable: true })
  birth_date: Date;

  @Column('char', { length: 1, nullable: true })
  sex: string; // M, F, O

  @OneToMany(() => Enrollment, enrollment => enrollment.student)
  enrollments: Enrollment[];
}