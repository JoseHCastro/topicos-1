import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

export enum ProfessorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@ChildEntity()
export class Professor extends User {
  // Solo campos esenciales para profesores
  @Column('varchar', { length: 20, unique: true })
  professorCode: string; // Código del docente

  @Column('varchar', { length: 100, nullable: true })
  department?: string; // Departamento

  @Column({ type: 'enum', enum: ProfessorStatus, default: ProfessorStatus.ACTIVE })
  status: ProfessorStatus;
}