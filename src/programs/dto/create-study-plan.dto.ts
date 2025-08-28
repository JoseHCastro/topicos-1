import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateStudyPlanDto {
  @IsUUID()
  degree_program_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  version: string;

  @IsBoolean()
  @IsOptional()
  is_current?: boolean = false;

  @IsDateString()
  valid_from: Date;

  @IsDateString()
  @IsOptional()
  valid_to?: Date;

  @IsString()
  @IsOptional()
  resolution?: string;
}