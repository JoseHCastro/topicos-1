import { IsUUID, IsEnum, IsOptional } from 'class-validator';

export class CreatePrerequisiteDto {
  @IsUUID()
  main_course_id: string;

  @IsUUID()
  required_course_id: string;

  @IsEnum(['required', 'optional'])
  @IsOptional()
  kind?: string = 'required';
}
