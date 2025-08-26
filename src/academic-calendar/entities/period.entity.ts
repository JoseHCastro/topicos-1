import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Management } from './management.entity';

@Entity('periodo')
export class Period {
  @PrimaryGeneratedColumn('increment')
  id_periodo: number;

  @Column('int')
  id_gestion: number;

  @Column('int')
  numero_periodo: number;

  @Column('varchar', { length: 50 })
  nombre_periodo: string;

  @Column('date')
  fecha_inicio: Date;

  @Column('date')
  fecha_fin: Date;

  @Column('date')
  fecha_inicio_inscripciones: Date;

  @Column('date')
  fecha_fin_inscripciones: Date;

  @Column({ type: 'enum', enum: ['planificado', 'activo', 'finalizado'] })
  estado: string;

  @ManyToOne(() => Management)
  @JoinColumn({ name: 'id_gestion' })
  gestion: Management;
}