import { IsString, IsUUID, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  course_section_id: string;

  @IsUUID()
  classroom_id: string;

  @IsString()
  @MaxLength(10)
  weekday: string;

  @IsString()
  time_start: string;

  @IsString()
  time_end: string;

  @IsOptional()
  @IsDateString()
  date_start?: string;

  @IsOptional()
  @IsDateString()
  date_end?: string;
}
