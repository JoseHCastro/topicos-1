import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Period, Management } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Period, Management])
  ],
  exports: [TypeOrmModule],
})
export class AcademicCalendarModule {}