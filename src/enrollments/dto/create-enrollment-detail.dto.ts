import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDate,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnrollmentDetailDto {
  @IsUUID()
  @IsOptional()
  enrollment_id?: string;

  // Alternativa: identificar enrollment por (student_code + term_name)
  @IsString()
  @IsOptional()
  student_code?: string;

  @IsString()
  @IsOptional()
  term_name?: string;

  @IsUUID()
  @IsOptional()
  course_section_id?: string;

  // Alternativa: identificar sección por (course_code + group_label + term_name [+ degree_program_code + study_plan_version])
  @IsString()
  @IsOptional()
  course_code?: string;

  @IsString()
  @IsOptional()
  group_label?: string;

  @IsString()
  @IsOptional()
  degree_program_code?: string;

  @IsString()
  @IsOptional()
  study_plan_version?: string;

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

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  closed_on?: Date;

  @IsString()
  @IsOptional()
  remark?: string;
}
