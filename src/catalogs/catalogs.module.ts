import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level, Term } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Level, Term])
  ],
  exports: [TypeOrmModule],
})
export class CatalogsModule {}