import { PartialType } from '@nestjs/mapped-types';
import { CreateEnrollmentDetailDto } from './create-enrollment-detail.dto';

export class UpdateEnrollmentDetailDto extends PartialType(CreateEnrollmentDetailDto) {}
