import { IsString, IsUUID, IsInt, Min, MaxLength, IsOptional } from 'class-validator';

export class CreateCourseSectionDto {
  @IsUUID()
  @IsOptional()
  course_id?: string;

  // Alternativa: identificar la materia por códigos
  @IsString()
  @IsOptional()
  degree_program_code?: string;

  @IsString()
  @IsOptional()
  study_plan_version?: string;

  @IsString()
  @IsOptional()
  course_code?: string;

  @IsUUID()
  @IsOptional()
  term_id?: string;

  // Alternativa: identificar el período por nombre (e.g., "2025-I")
  @IsString()
  @IsOptional()
  term_name?: string;

  @IsUUID()
  @IsOptional()
  teacher_id?: string;

  // Alternativa: identificar docente por email
  @IsString()
  @IsOptional()
  teacher_email?: string;

  @IsString()
  @MaxLength(10)
  group_label: string;

  @IsString()
  @MaxLength(20)
  modality: string;

  @IsString()
  @MaxLength(20)
  shift: string;

  @IsInt()
  @Min(1)
  quota_max: number;

  @IsInt()
  @Min(0)
  quota_available: number;
}
