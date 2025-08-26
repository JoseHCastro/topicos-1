import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateTermDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  year: string;

  @IsNumber()
  @Min(1)
  number: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}