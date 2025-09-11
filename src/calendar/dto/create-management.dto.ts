import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  MinLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateManagementDto {
  @IsNumber()
  @Min(2000)
  year: number;

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
}
