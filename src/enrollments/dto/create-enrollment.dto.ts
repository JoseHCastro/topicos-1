import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateEnrollmentDto {
  @IsDateString()
  fecha_inscripcion: Date;

  @IsEnum(['regular', 'segunda', 'final'])
  tipo_inscripcion: string;

  @IsEnum(['activa', 'cancelada', 'finalizada'])
  @IsOptional()
  estado?: string = 'activa';

  @IsNumber()
  @Min(1)
  id_estudiante: number;

  @IsNumber()
  @Min(1)
  id_periodo: number;
}