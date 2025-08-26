import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Subject } from '../../programs/entities/subject.entity';
import { Professor } from '../../auth/entities/professor.entity';
import { Period } from '../../academic-calendar/entities/period.entity';
import { Classroom } from './classroom.entity';
import { Schedule } from './schedule.entity';

@Entity('grupo_materia')
export class SubjectGroup {
  @PrimaryGeneratedColumn('increment')
  id_grupo_materia: number;

  @Column('int')
  id_materia: number;

  @Column('varchar', { length: 10 })
  numero_grupo: string;

  @Column('int')
  cupo_maximo: number;

  @Column('int')
  cupo_actual: number;

  @Column('varchar', { length: 150 })
  docente: string;

  @Column({ type: 'enum', enum: ['abierto', 'cerrado', 'cancelado'], default: 'abierto' })
  estado: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'id_materia' })
  materia: Subject;

  @ManyToOne(() => Professor)
  @JoinColumn({ name: 'id_profesor' })
  profesor: Professor;

  @ManyToOne(() => Period)
  @JoinColumn({ name: 'id_periodo' })
  periodo: Period;

  @ManyToOne(() => Classroom)
  @JoinColumn({ name: 'id_aula' })
  aula: Classroom;

  @OneToMany(() => Schedule, schedule => schedule.grupoMateria)
  horarios: Schedule[];
}