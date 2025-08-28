import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
  Min,
} from 'class-validator';

export class CreateSubjectDto {
  @IsUUID()
  study_plan_id: string;

  @IsUUID()
  level_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  name: string;

  @IsNumber()
  @Min(1)
  credits: number;

  @IsNumber()
  @Min(0)
  hours_theory: number;

  @IsNumber()
  @Min(0)
  hours_practice: number;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string = 'active';
}