import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('docente')
export class Teacher {
  @PrimaryGeneratedColumn('increment')
  id_docente: number;

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

  @Column('varchar', { length: 100 })
  email: string;

  @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
  estado: string;
}