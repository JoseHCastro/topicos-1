import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  MinLength,
  Min,
} from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  codigo_materia: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  nombre_materia: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(1)
  creditos: number;

  @IsNumber()
  @Min(0)
  horas_teoricas: number;

  @IsNumber()
  @Min(0)
  horas_practicas: number;

  @IsNumber()
  @Min(0)
  horas_laboratorio: number;

  @IsNumber()
  @Min(1)
  semestre_recomendado: number;

  @IsBoolean()
  @IsOptional()
  es_obligatoria?: boolean = false;

  @IsEnum(['activa', 'inactiva'])
  @IsOptional()
  estado?: string = 'activa';

  @IsNumber()
  @Min(1)
  id_plan_estudio: number;

  @IsNumber()
  @Min(1)
  id_nivel: number;
}