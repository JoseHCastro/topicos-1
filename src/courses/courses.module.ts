import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Classroom, Schedule, SubjectGroup } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Classroom, Schedule, SubjectGroup])
  ],
  exports: [TypeOrmModule],
})
export class CoursesModule {}