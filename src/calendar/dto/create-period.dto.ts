import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsDate,
  IsEnum,
  MinLength,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @IsEnum(['planned', 'active', 'finished', 'pending', 'completed'])
  status: string;
}
