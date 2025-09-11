import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsBoolean,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudyPlanDto {
  @IsUUID()
  @IsOptional()
  degree_program_id?: string;

  // Alternativa por código de programa (sin ID)
  @IsString()
  @IsOptional()
  degree_program_code?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  version: string;

  @IsBoolean()
  @IsOptional()
  is_current?: boolean = false;

  @Type(() => Date)
  @IsDate()
  valid_from: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  valid_to?: Date;

  @IsString()
  @IsOptional()
  resolution?: string;
}
