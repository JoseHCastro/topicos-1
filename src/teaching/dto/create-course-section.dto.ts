import { IsString, IsUUID, IsInt, Min, MaxLength } from 'class-validator';

export class CreateCourseSectionDto {
  @IsUUID()
  course_id: string;

  @IsUUID()
  term_id: string;

  @IsUUID()
  teacher_id: string;

  @IsString()
  @MaxLength(10)
  group_label: string;

  @IsString()
  @MaxLength(20)
  modality: string;

  @IsString()
  @MaxLength(20)
  shift: string;

  @IsInt()
  @Min(1)
  quota_max: number;

  @IsInt()
  @Min(0)
  quota_available: number;
}