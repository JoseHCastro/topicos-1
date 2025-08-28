import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateEnrollmentDetailDto {
  @IsUUID()
  enrollment_id: string;

  @IsUUID()
  course_section_id: string;

  @IsEnum(['Enrolled', 'Approved', 'Failed', 'Withdrawn'])
  @IsOptional()
  course_state?: string = 'Enrolled';

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  final_grade?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  attempts?: number = 1;

  @IsDateString()
  @IsOptional()
  closed_on?: Date;

  @IsString()
  @IsOptional()
  remark?: string;
}