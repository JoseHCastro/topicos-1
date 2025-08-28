import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

@ChildEntity()
export class Teacher extends User {
  @Column('varchar', { length: 50 })
  category: string; // e.g., Tenured

  @Column('varchar', { length: 50 })
  workload: string; // e.g., FullTime, PartTime

  @Column('varchar', { length: 30 })
  contract_type: string; // e.g., Temporary

  @Column('date')
  hired_at: Date;
}