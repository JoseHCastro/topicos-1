import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { Period } from '../../academic-calendar/entities/period.entity';
import { EnrollmentDetail } from './enrollment-detail.entity';

@Entity('inscripcion')
export class Enrollment {
  @PrimaryGeneratedColumn('increment')
  id_inscripcion: number;

  @Column('timestamp')
  fecha_inscripcion: Date;

  @Column({ type: 'enum', enum: ['regular', 'segunda', 'final'] })
  tipo_inscripcion: string;

  @Column({ type: 'enum', enum: ['activa', 'cancelada', 'finalizada'] })
  estado: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'id_estudiante' })
  estudiante: Student;

  @ManyToOne(() => Period)
  @JoinColumn({ name: 'id_periodo' })
  periodo: Period;

  @OneToMany(() => EnrollmentDetail, detail => detail.inscripcion)
  detalles: EnrollmentDetail[];
}