import {
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateEnrollmentDetailDto {
  @IsNumber()
  @Min(1)
  id_inscripcion: number;

  @IsNumber()
  @Min(1)
  id_grupo_materia: number;

  @IsDateString()
  fecha_inscripcion_materia: Date;

  @IsEnum(['inscrito', 'aprobado', 'reprobado'])
  @IsOptional()
  estado_materia?: string = 'inscrito';
}