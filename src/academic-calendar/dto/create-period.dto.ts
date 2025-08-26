import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsEnum,
  MinLength,
  Min,
} from 'class-validator';

export class CreatePeriodDto {
  @IsNumber()
  @Min(1)
  id_gestion: number;

  @IsNumber()
  @Min(1)
  numero_periodo: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nombre_periodo: string;

  @IsDateString()
  fecha_inicio: Date;

  @IsDateString()
  fecha_fin: Date;

  @IsDateString()
  fecha_inicio_inscripciones: Date;

  @IsDateString()
  fecha_fin_inscripciones: Date;

  @IsEnum(['planificado', 'activo', 'finalizado'])
  estado: string;
}