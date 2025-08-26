import { ChildEntity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Career } from '../../programs/entities/career.entity';

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@ChildEntity()
export class Student extends User {
  @Column('varchar', { length: 20, unique: true })
  studentCode: string; // Código del estudiante

  @Column('varchar', { length: 100 })
  nationalId: string; // CI o cédula de identidad

  @Column('date')
  birthDate: Date;

  @Column('varchar', { length: 15 })
  phone: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @ManyToOne(() => Career)
  @JoinColumn({ name: 'career_id' })
  career: Career;
}