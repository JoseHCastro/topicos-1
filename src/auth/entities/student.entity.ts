import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@ChildEntity()
export class Student extends User {

  @Column('varchar', { length: 20, unique: true })
  studentId: string;

  @Column('varchar', { length: 100, nullable: true })
  career?: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;
}