import {
  IsNumber,
  IsEnum,
  IsString,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateScheduleDto {
  @IsNumber()
  @Min(1)
  id_grupo_materia: number;

  @IsNumber()
  @Min(1)
  id_aula: number;

  @IsEnum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'])
  dia_semana: string;

  @IsString()
  @IsNotEmpty()
  hora_inicio: string;

  @IsString()
  @IsNotEmpty()
  hora_fin: string;

  @IsEnum(['teorica', 'practica', 'laboratorio'])
  tipo_clase: string;
}