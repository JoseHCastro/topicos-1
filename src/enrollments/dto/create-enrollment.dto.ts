import {
  IsDateString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  @IsOptional()
  student_id?: string;

  // Alternativa: identificar estudiante por código
  @IsString()
  @IsOptional()
  student_code?: string;

  @IsUUID()
  @IsOptional()
  term_id?: string;

  // Alternativa: identificar período por nombre (e.g., "2025-I")
  @IsString()
  @IsOptional()
  term_name?: string;

  @IsDateString()
  enrolled_on: Date;

  @IsEnum(['Active', 'Canceled'])
  @IsOptional()
  state?: string = 'Active';

  @IsEnum(['Regular', 'Extra'])
  @IsOptional()
  origin?: string = 'Regular';

  @IsString()
  @IsOptional()
  note?: string;
}
