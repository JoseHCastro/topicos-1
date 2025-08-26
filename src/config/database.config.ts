import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Student, Professor, Admin } from '../auth/entities';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'UagrmDB',
  entities: [User, Student, Professor, Admin],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
  migrationsRun: false,
});
