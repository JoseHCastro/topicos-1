// create-user.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  ci?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  nombre?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  apellido_paterno?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  apellido_materno?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  fecha_nacimiento?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  telefono?: string;

  @IsEnum(StudentStatus)
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.STUDENT)
  estado?: StudentStatus;

  // Campos específicos de Professor
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  professorCode?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  department?: string;

  @IsEnum(ProfessorStatus)
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.PROFESSOR)
  professorStatus?: ProfessorStatus;
}
