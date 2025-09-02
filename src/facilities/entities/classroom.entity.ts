import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Schedule } from '../../teaching/entities/schedule.entity';

@Entity('classroom')
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 20 })
  code: string;

  @Column('varchar', { length: 50 })
  building: string;

  @Column('varchar', { length: 50 })
  campus: string;

  @Column('int')
  capacity: number;

  @Column('varchar', { length: 20 })
  room_type: string; // Lecture, Lab

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updated_at: Date;

  @OneToMany(() => Schedule, (schedule) => schedule.classroom)
  schedules: Schedule[];
}
