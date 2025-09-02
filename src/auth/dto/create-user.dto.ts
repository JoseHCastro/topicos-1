import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario (debe ser único)',
    example: 'estudiante@uagrm.edu.bo',
    format: 'email'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
    minLength: 6,
    maxLength: 50,
    pattern: '/(?:(?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$/'
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe tener una letra mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiProperty({
    description: 'Nombre(s) del usuario',
    example: 'Juan Carlos',
    minLength: 1
  })
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Apellido(s) del usuario',
    example: 'Pérez García',
    minLength: 1
  })
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  lastName: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  studentCode?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  nationalId?: string;

  @IsDateString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  birthDate?: Date;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.TEACHER)
  teacherCode?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.TEACHER)
  teacherNationalId?: string;

  @IsDateString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.TEACHER)
  teacherBirthDate?: Date;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.TEACHER)
  department?: string;
}
