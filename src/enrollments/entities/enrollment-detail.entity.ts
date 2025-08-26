import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { SubjectGroup } from '../../courses/entities/subject-group.entity';

@Entity('detalle')
export class EnrollmentDetail {
  @PrimaryGeneratedColumn('increment')
  id_detalle: number;

  @Column('int')
  id_inscripcion: number;

  @Column('int')
  id_grupo_materia: number;

  @Column('timestamp')
  fecha_inscripcion_materia: Date;

  @Column({ type: 'enum', enum: ['inscrito', 'aprobado', 'reprobado'] })
  estado_materia: string;

  @ManyToOne(() => Enrollment, enrollment => enrollment.detalles)
  @JoinColumn({ name: 'id_inscripcion' })
  inscripcion: Enrollment;

  @ManyToOne(() => SubjectGroup)
  @JoinColumn({ name: 'id_grupo_materia' })
  grupoMateria: SubjectGroup;
}