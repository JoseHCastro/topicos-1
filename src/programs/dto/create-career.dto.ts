import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  MinLength,
  Min,
} from 'class-validator';

export class CreateCareerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  codigo_carrera: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  nombre_carrera: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(1)
  duracion_semestres: number;

  @IsString()
  @IsNotEmpty()
  titulo_otorgado: string;

  @IsEnum(['presencial', 'virtual'])
  @IsOptional()
  modalidad?: string = 'presencial';

  @IsEnum(['activa', 'inactiva'])
  @IsOptional()
  estado?: string = 'activa';
}