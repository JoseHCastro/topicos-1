import {
  IsDateString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  term_id: string;

  @IsDateString()
  enrolled_on: Date;

  @IsEnum(['Active', 'Canceled'])
  @IsOptional()
  state?: string = 'Active';

  @IsEnum(['Regular', 'Extra'])
  @IsOptional()
  origin?: string = 'Regular';

  @IsString()
  @IsOptional()
  note?: string;
}
