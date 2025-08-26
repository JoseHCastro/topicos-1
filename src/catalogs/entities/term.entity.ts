import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Term {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 10 })
  year: string;

  @Column('int')
  number: number;

  @Column('varchar', { length: 20 })
  name: string;

  @Column({ default: true })
  isActive: boolean;
}