import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsDateString,
  IsEnum,
  MinLength,
} from 'class-validator';

export class CreatePeriodDto {
  @IsUUID()
  academic_year_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsDateString()
  start_date: Date;

  @IsDateString()
  end_date: Date;

  @IsEnum(['planned', 'active', 'finished'])
  status: string;
}
