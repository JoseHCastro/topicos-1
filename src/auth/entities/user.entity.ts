import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
  CreateDateColumn,
} from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100, unique: true })
  email: string;

  @Column('text')
  password: string;

  @Column('varchar', { length: 100 })
  firstName: string;

  @Column('varchar', { length: 100 })
  lastName: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  dateRegister: Date;
  
  @Column({ type: 'enum', enum: ['ADMIN', 'STUDENT', 'PROFESSOR'] })
  role: string;
}
