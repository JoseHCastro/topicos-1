import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SubjectGroup } from './subject-group.entity';
import { Classroom } from './classroom.entity';

@Entity('horario')
export class Schedule {
  @PrimaryGeneratedColumn('increment')
  id_horario: number;

  @Column('int')
  id_grupo_materia: number;

  @Column('int')
  id_aula: number;

  @Column({ type: 'enum', enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] })
  dia_semana: string;

  @Column('time')
  hora_inicio: string;

  @Column('time')
  hora_fin: string;

  @Column({ type: 'enum', enum: ['teorica', 'practica', 'laboratorio'] })
  tipo_clase: string;

  @ManyToOne(() => SubjectGroup, subjectGroup => subjectGroup.horarios)
  @JoinColumn({ name: 'id_grupo_materia' })
  grupoMateria: SubjectGroup;

  @ManyToOne(() => Classroom)
  @JoinColumn({ name: 'id_aula' })
  aula: Classroom;
}