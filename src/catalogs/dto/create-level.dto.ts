import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLevelDto {
  @IsNumber()
  @Min(1)
  numero_nivel: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nombre_nivel: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  descripcion: string;
}