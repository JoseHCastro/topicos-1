import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateCareerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  degree_title: string;

  @IsEnum(['presencial', 'virtual'])
  @IsOptional()
  modality?: string = 'presencial';

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string = 'active';
}