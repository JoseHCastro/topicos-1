import { IsString, MinLength, MaxLength, IsIn } from 'class-validator';

export class CreateDegreeProgramDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  degree_title!: string;

  @IsString()
  @IsIn(['Onsite', 'Online', 'Hybrid'])
  modality!: string;

  @IsString()
  @IsIn(['Active', 'Inactive'])
  status!: string;
}

