import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

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
}