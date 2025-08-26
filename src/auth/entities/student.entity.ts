import { ChildEntity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Career } from '../../programs/entities/career.entity';

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@ChildEntity()
export class Student extends User {
  @Column('varchar', { length: 100 })
  ci: string;

  @Column('varchar', { length: 100 })
  nombre: string;

  @Column('varchar', { length: 100 })
  apellido_paterno: string;

  @Column('varchar', { length: 100 })
  apellido_materno: string;

  @Column('varchar', { length: 100 })
  fecha_nacimiento: string;

  @Column('varchar', { length: 100 })
  telefono: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  estado: StudentStatus;

  @ManyToOne(() => Career)
  @JoinColumn({ name: 'carrera_id' })
  carrera: Career;
}