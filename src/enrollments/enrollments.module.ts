import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Enrollment, EnrollmentDetail } from './entities';
import { CourseSection } from '../teaching/entities';
import { Prerequisite } from '../programs/entities';
import { Schedule } from '../teaching/entities';
import { Grade } from '../assessments/entities';
import { EnrollmentService, EnrollmentDetailService, AtomicEnrollmentService, AcademicValidationService } from './services';
import { EnrollmentController, EnrollmentDetailController, AtomicEnrollmentController, AcademicValidationController } from './controllers';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment, 
      EnrollmentDetail, 
      CourseSection,
      Prerequisite,
      Schedule,
      Grade
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    CommonModule,
  ],
  controllers: [EnrollmentController, EnrollmentDetailController, AtomicEnrollmentController, AcademicValidationController],
  providers: [EnrollmentService, EnrollmentDetailService, AtomicEnrollmentService, AcademicValidationService],
  exports: [TypeOrmModule, EnrollmentService, EnrollmentDetailService, AtomicEnrollmentService, AcademicValidationService],
})
export class EnrollmentsModule {}