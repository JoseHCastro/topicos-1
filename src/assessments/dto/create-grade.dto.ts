import { IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateGradeDto {
  @IsUUID()
  course_section_id: string;

  @IsUUID()
  student_id: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  final_grade?: number;
}