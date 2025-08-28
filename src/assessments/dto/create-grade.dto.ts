import { IsString, IsUUID, IsNumber, IsDateString, IsOptional, MaxLength, Min, Max } from 'class-validator';

export class CreateGradeDto {
  @IsUUID()
  course_section_id: string;

  @IsUUID()
  student_id: string;

  @IsString()
  @MaxLength(50)
  assessment: string; // Midterm1, Final, ...

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  weight?: number; // percentage

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  score: number;

  @IsDateString()
  recorded_at: string;
}