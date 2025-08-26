import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateGradeDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  primer_parcial: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  segundo_parcial: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  examen_final: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  trabajos_practicos: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  nota_final: number;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsNumber()
  @Min(1)
  id_detalle: number;
}