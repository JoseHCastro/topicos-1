import { IsInt, Min, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateLevelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @IsInt()
  @Min(1)
  order!: number;
}

