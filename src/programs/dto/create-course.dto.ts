import {
  IsUUID,
  IsString,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO flexible para crear Course admitiendo dos modalidades:
 * 1) Por IDs (study_plan_id, level_id)
 * 2) Por identificadores de negocio (degree_program_code, study_plan_version, level_order)
 */
export class CreateCourseDto {
  // Opción 1: IDs directos
  @IsUUID()
  @IsOptional()
  study_plan_id?: string;

  @IsUUID()
  @IsOptional()
  level_id?: string;

  // Opción 2: Identificadores de negocio
  @IsString()
  @IsOptional()
  @MinLength(1)
  degree_program_code?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  study_plan_version?: string;

  @IsInt()
  @IsOptional()
  level_order?: number;

  // Campos propios del curso
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsInt()
  @Min(1)
  credits!: number;

  @IsInt()
  @Min(0)
  hours_theory!: number;

  @IsInt()
  @Min(0)
  hours_practice!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  status!: string; // e.g. 'Active'
}

