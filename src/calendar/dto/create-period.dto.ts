import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsDateString,
  IsEnum,
  MinLength,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreatePeriodDto {
  @IsUUID()
  @IsOptional()
  academic_year_id?: string;

  // Alternativa: identificar año académico por año (e.g., 2025)
  @IsInt()
  @Min(2000)
  @IsOptional()
  year?: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsDateString()
  start_date: Date;

  @IsDateString()
  end_date: Date;

  @IsEnum(['planned', 'active', 'finished', 'pending', 'completed'])
  status: string;
}
