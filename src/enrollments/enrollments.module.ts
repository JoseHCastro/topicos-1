import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Enrollment, EnrollmentDetail } from './entities';
import { EnrollmentService, EnrollmentDetailService } from './services';
import { EnrollmentController, EnrollmentDetailController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, EnrollmentDetail]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
  ],
  controllers: [EnrollmentController, EnrollmentDetailController],
  providers: [EnrollmentService, EnrollmentDetailService],
  exports: [TypeOrmModule, EnrollmentService, EnrollmentDetailService],
})
export class EnrollmentsModule {}