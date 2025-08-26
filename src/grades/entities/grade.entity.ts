import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EnrollmentDetail } from '../../enrollments/entities/enrollment-detail.entity';

@Entity('nota')
export class Grade {
  @PrimaryGeneratedColumn('increment')
  id_nota: number;

  @Column('decimal', { precision: 5, scale: 2 })
  primer_parcial: number;

  @Column('decimal', { precision: 5, scale: 2 })
  segundo_parcial: number;

  @Column('decimal', { precision: 5, scale: 2 })
  examen_final: number;

  @Column('decimal', { precision: 5, scale: 2 })
  trabajos_practicos: number;

  @Column('decimal', { precision: 5, scale: 2 })
  nota_final: number;

  @Column('text', { nullable: true })
  observaciones: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;

  @ManyToOne(() => EnrollmentDetail)
  @JoinColumn({ name: 'id_detalle' })
  detalle: EnrollmentDetail;
}