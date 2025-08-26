import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Career } from './career.entity';
import { Subject } from './subject.entity';

@Entity('plan_estudio')
export class StudyPlan {
  @PrimaryGeneratedColumn('increment')
  id_plan_estudio: number;

  @Column('int')
  id_carrera: number;

  @Column('varchar', { length: 20 })
  version: string;

  @Column('int')
  año_aprobacion: number;

  @Column('int')
  creditos_totales: number;

  @Column('date')
  fecha_inicio_vigencia: Date;

  @Column('date')
  fecha_fin_vigencia: Date;

  @Column({ type: 'enum', enum: ['vigente', 'obsoleto'], default: 'vigente' })
  estado: string;

  @ManyToOne(() => Career, career => career.planesEstudio)
  @JoinColumn({ name: 'id_carrera' })
  carrera: Career;

  @OneToMany(() => Subject, subject => subject.planEstudio)
  materias: Subject[];
}