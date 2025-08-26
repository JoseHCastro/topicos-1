import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

export enum ProfessorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@ChildEntity()
export class Professor extends User {
  @Column('varchar', { length: 20, unique: true })
  professorCode: string; // Código del docente

  @Column('varchar', { length: 100 })
  nationalId: string; // CI o cédula de identidad

  @Column('date')
  birthDate: Date;

  @Column('varchar', { length: 15 })
  phone: string;

  @Column('varchar', { length: 100, nullable: true })
  department?: string; // Departamento

  @Column({ type: 'enum', enum: ProfessorStatus, default: ProfessorStatus.ACTIVE })
  status: ProfessorStatus;
}