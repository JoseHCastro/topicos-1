import {
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';

export class CreatePrerequisiteDto {
  @IsNumber()
  @Min(1)
  id_materia: number;

  @IsNumber()
  @Min(1)
  id_materia_prerequisito: number;

  @IsEnum(['obligatorio', 'opcional'])
  @IsOptional()
  tipo_prerequisito?: string = 'obligatorio';
}