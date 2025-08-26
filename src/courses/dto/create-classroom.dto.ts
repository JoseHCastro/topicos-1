import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  MinLength,
  Min,
} from 'class-validator';

export class CreateClassroomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  codigo_aula: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nombre_aula: string;

  @IsNumber()
  @Min(1)
  capacidad: number;

  @IsString()
  @IsNotEmpty()
  edificio: string;

  @IsNumber()
  @Min(1)
  piso: number;

  @IsEnum(['tradicional', 'laboratorio'])
  tipo_aula: string;

  @IsString()
  @IsOptional()
  equipamiento?: string;

  @IsEnum(['disponible', 'ocupada', 'mantenimiento'])
  @IsOptional()
  estado?: string = 'disponible';
}