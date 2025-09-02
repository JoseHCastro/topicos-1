import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user')
@TableInheritance({ column: { type: 'varchar', name: 'user_type' } })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  first_name: string;

  @Column('varchar', { length: 100 })
  last_name: string;

  @Column('varchar', { length: 150, unique: true })
  email: string;

  @Column('text', { select: false })
  password: string;

  @Column('varchar', { length: 30, nullable: true })
  phone: string;

  @Column('varchar', { length: 20 })
  user_type: string;

  @Column('varchar', { length: 20, default: 'Active' })
  status: string;

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
}
