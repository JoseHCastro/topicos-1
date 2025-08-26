import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('gestion')
export class Management {
  @PrimaryGeneratedColumn('increment')
  id_gestion: number;

  @Column('int')
  año: number;

  @Column('varchar', { length: 100 })
  descripcion: string;

  @Column('date')
  fecha_inicio: Date;

  @Column('date')
  fecha_fin: Date;

  @Column({ type: 'enum', enum: ['planificada', 'activa', 'finalizada'] })
  estado: string;
}