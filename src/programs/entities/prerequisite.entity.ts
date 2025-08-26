import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Subject } from './subject.entity';

@Entity('prerequisito')
export class Prerequisite {
  @PrimaryGeneratedColumn('increment')
  id_prerequisito: number;

  @Column('int')
  id_materia: number;

  @Column('int')
  id_materia_prerequisito: number;

  @Column({ type: 'enum', enum: ['obligatorio', 'opcional'], default: 'obligatorio' })
  tipo_prerequisito: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @ManyToOne(() => Subject, subject => subject.prerequisitos)
  @JoinColumn({ name: 'id_materia' })
  materia: Subject;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'id_materia_prerequisito' })
  materiaPrerequisito: Subject;
}