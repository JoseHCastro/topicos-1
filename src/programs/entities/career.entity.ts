import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { StudyPlan } from './study-plan.entity';

@Entity('carrera')
export class Career {
  @PrimaryGeneratedColumn('increment')
  id_carrera: number;

  @Column('varchar', { length: 20 })
  codigo_carrera: string;

  @Column('varchar', { length: 150 })
  nombre_carrera: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('int')
  duracion_semestres: number;

  @Column('varchar', { length: 100 })
  titulo_otorgado: string;

  @Column({ type: 'enum', enum: ['presencial', 'virtual'], default: 'presencial' })
  modalidad: string;

  @Column({ type: 'enum', enum: ['activa', 'inactiva'], default: 'activa' })
  estado: string;

  @OneToMany(() => StudyPlan, studyPlan => studyPlan.carrera)
  planesEstudio: StudyPlan[];
}