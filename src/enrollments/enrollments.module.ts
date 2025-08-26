import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment, EnrollmentDetail } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, EnrollmentDetail])
  ],
  exports: [TypeOrmModule],
})
export class EnrollmentsModule {}