// create-user.dto.ts
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

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe tener una letra mayúscula, una minúscula y un número',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  lastName: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  // Campo teléfono general para todos los tipos de usuario
  @IsString()
  @IsOptional()
  phone?: string;

  // Campos específicos de Student
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

  // Campos específicos de Teacher
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
