import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade, AcademicProgress, CourseHistory } from './entities';
import { GradeService } from './services';
import { GradeController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, AcademicProgress, CourseHistory])],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService],
})
export class AssessmentsModule {}