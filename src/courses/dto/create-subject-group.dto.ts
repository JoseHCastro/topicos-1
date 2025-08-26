import {
  IsNumber,
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Min,
} from 'class-validator';

export class CreateSubjectGroupDto {
  @IsNumber()
  @Min(1)
  id_materia: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  numero_grupo: string;

  @IsNumber()
  @Min(1)
  cupo_maximo: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cupo_actual?: number = 0;

  @IsString()
  @IsNotEmpty()
  docente: string;

  @IsEnum(['abierto', 'cerrado', 'cancelado'])
  @IsOptional()
  estado?: string = 'abierto';

  @IsNumber()
  @Min(1)
  id_profesor: number;

  @IsNumber()
  @Min(1)
  id_periodo: number;

  @IsNumber()
  @Min(1)
  id_aula: number;
}