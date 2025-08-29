import { IsString, IsInt, Min, MaxLength } from 'class-validator';

export class CreateClassroomDto {
  @IsString()
  @MaxLength(20)
  code: string;

  @IsString()
  @MaxLength(50)
  building: string;

  @IsString()
  @MaxLength(50)
  campus: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @MaxLength(20)
  room_type: string;
}
