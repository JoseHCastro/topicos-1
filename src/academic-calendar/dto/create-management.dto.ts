import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  MinLength,
  Min,
} from 'class-validator';

export class CreateManagementDto {
  @IsNumber()
  @Min(2000)
  año: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  descripcion: string;

  @IsDateString()
  fecha_inicio: Date;

  @IsDateString()
  fecha_fin: Date;

  @IsEnum(['planificada', 'activa', 'finalizada'])
  estado: string;
}