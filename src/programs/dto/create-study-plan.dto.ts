import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  MinLength,
  Min,
} from 'class-validator';

export class CreateStudyPlanDto {
  @IsNumber()
  @Min(1)
  id_carrera: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  version: string;

  @IsNumber()
  @Min(2000)
  año_aprobacion: number;

  @IsNumber()
  @Min(1)
  creditos_totales: number;

  @IsDateString()
  fecha_inicio_vigencia: Date;

  @IsDateString()
  fecha_fin_vigencia: Date;

  @IsEnum(['vigente', 'obsoleto'])
  @IsOptional()
  estado?: string = 'vigente';
}