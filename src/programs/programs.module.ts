import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Career, StudyPlan, Subject, Prerequisite } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Career, StudyPlan, Subject, Prerequisite])
  ],
  exports: [TypeOrmModule],
})
export class ProgramsModule {}