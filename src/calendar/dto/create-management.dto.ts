import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  MinLength,
  Min,
} from 'class-validator';

export class CreateManagementDto {
  @IsNumber()
  @Min(2000)
  year: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsDateString()
  start_date: Date;

  @IsDateString()
  end_date: Date;
}