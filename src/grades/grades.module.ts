import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grade])
  ],
  exports: [TypeOrmModule],
})
export class GradesModule {}