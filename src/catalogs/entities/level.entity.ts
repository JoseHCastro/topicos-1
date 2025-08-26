import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('nivel')
export class Level {
  @PrimaryGeneratedColumn('increment')
  id_nivel: number;

  @Column('int')
  numero_nivel: number;

  @Column('varchar', { length: 50 })
  nombre_nivel: string;

  @Column('varchar', { length: 200 })
  descripcion: string;
}