import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('aula')
export class Classroom {
  @PrimaryGeneratedColumn('increment')
  id_aula: number;

  @Column('varchar', { length: 20 })
  codigo_aula: string;

  @Column('varchar', { length: 100 })
  nombre_aula: string;

  @Column('int')
  capacidad: number;

  @Column('varchar', { length: 50 })
  edificio: string;

  @Column('int')
  piso: number;

  @Column({ type: 'enum', enum: ['tradicional', 'laboratorio'] })
  tipo_aula: string;

  @Column('text', { nullable: true })
  equipamiento: string;

  @Column({ type: 'enum', enum: ['disponible', 'ocupada', 'mantenimiento'] })
  estado: string;
}