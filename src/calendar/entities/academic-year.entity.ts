import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Term } from './term.entity';

@Entity('academic_year')
export class AcademicYear {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('smallint')
  year: number;

  @Column('varchar', { length: 50 })
  name: string;

  @Column('date')
  start_date: Date;

  @Column('date')
  end_date: Date;

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

  @OneToMany(() => Term, (term) => term.academic_year)
  terms: Term[];
}
