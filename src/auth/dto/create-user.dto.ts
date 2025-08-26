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
import { StudentStatus } from '../entities/student.entity';
import { ProfessorStatus } from '../entities/professor.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  PROFESSOR = 'PROFESSOR',
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

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  phone?: string;

  @IsEnum(StudentStatus)
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  studentStatus?: StudentStatus;

  // Campos específicos de Professor
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  professorCode?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  professorNationalId?: string;

  @IsDateString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  professorBirthDate?: Date;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  professorPhone?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  department?: string;

  @IsEnum(ProfessorStatus)
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  professorStatus?: ProfessorStatus;
}
