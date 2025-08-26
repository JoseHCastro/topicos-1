import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { StudyPlan } from './study-plan.entity';
import { Level } from '../../catalogs/entities/level.entity';
import { Prerequisite } from './prerequisite.entity';

@Entity('materia')
export class Subject {
  @PrimaryGeneratedColumn('increment')
  id_materia: number;

  @Column('varchar', { length: 15 })
  codigo_materia: string;

  @Column('varchar', { length: 150 })
  nombre_materia: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('int')
  creditos: number;

  @Column('int')
  horas_teoricas: number;

  @Column('int')
  horas_practicas: number;

  @Column('int')
  horas_laboratorio: number;

  @Column('int')
  semestre_recomendado: number;

  @Column('boolean', { default: false })
  es_obligatoria: boolean;

  @Column({ type: 'enum', enum: ['activa', 'inactiva'], default: 'activa' })
  estado: string;

  @ManyToOne(() => StudyPlan, studyPlan => studyPlan.materias)
  @JoinColumn({ name: 'id_plan_estudio' })
  planEstudio: StudyPlan;

  @ManyToOne(() => Level)
  @JoinColumn({ name: 'id_nivel' })
  nivel: Level;

  @OneToMany(() => Prerequisite, prerequisite => prerequisite.materia)
  prerequisitos: Prerequisite[];
}