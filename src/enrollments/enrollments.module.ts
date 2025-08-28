import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Enrollment, EnrollmentDetail } from './entities';
import { CourseSection } from '../teaching/entities';
import { EnrollmentService, EnrollmentDetailService, AtomicEnrollmentService } from './services';
import { EnrollmentController, EnrollmentDetailController, AtomicEnrollmentController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, EnrollmentDetail, CourseSection]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
  ],
  controllers: [EnrollmentController, EnrollmentDetailController, AtomicEnrollmentController],
  providers: [EnrollmentService, EnrollmentDetailService, AtomicEnrollmentService],
  exports: [TypeOrmModule, EnrollmentService, EnrollmentDetailService, AtomicEnrollmentService],
})
export class EnrollmentsModule {}