import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, User, Professor, Admin } from './entities';
import * as bcrypt from 'bcrypt';
import {
  ChangePasswordDto,
  CreateUserDto,
  LoginUserDto,
  UserRole,
} from './dto';
import { JwtPayload } from './interfaces';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}
  
  async create(createUserDto: CreateUserDto) {
    const { email, password, role } = createUserDto;

    console.log('🔍 DEBUG Backend - Datos recibidos en create:', {
      createUserDto,
      email,
      role,
      expectedStudent: 'STUDENT',
      expectedProfessor: 'PROFESSOR',
      isStudent: role === UserRole.STUDENT,
      isProfessor: role === UserRole.PROFESSOR
    });

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException(`El usuario con email ${email} ya existe`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario según el rol
    if (role === UserRole.STUDENT) {
      console.log('✅ Creando STUDENT');
      const student = await this.createStudent(createUserDto, hashedPassword);
      return {
        user: this.parseUser(student),
        token: this.getJwtToken({ email: student.email, id: student.id, rol: student.role }),
      };
    }

    if (role === UserRole.PROFESSOR) {
      console.log('✅ Creando PROFESSOR');
      const professor = await this.createProfessor(createUserDto, hashedPassword);
      return {
        user: this.parseUser(professor),
        token: this.getJwtToken({ email: professor.email, id: professor.id, rol: professor.role }),
      };
    }

    if (role === UserRole.ADMIN) {
      console.log('✅ Creando ADMIN');
      const admin = await this.createAdmin(createUserDto, hashedPassword);
      return {
        user: this.parseUser(admin),
        token: this.getJwtToken({ email: admin.email, id: admin.id, rol: admin.role }),
      };
    }

    throw new BadRequestException(`Rol ${role} no válido`);
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true, firstName: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credentials are not valid (email)');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Credentials are not valid (password)');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      token: this.getJwtToken({ email: user.email, id: user.id, rol: user.role }),
    };
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { currentPassword, newPassword } = changePasswordDto;

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      throw new UnauthorizedException('Credentials are not valid (password)');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update(id, { password: hashedPassword });
    return { message: 'Contraseña cambiada con exito' };
  }

  checkAuthStatus(user: User) {
    return {
      ...this.parseUser(user),
      token: this.getJwtToken({ email: user.email, id: user.id, rol: user.role }),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const userUpdate = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!userUpdate) {
      throw new NotFoundException(`Usuario con ID: ${id} no encontrado`);
    }
    const savedUser = await this.userRepository.save(userUpdate);

    return savedUser;
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private parseUser(user: User) {
    const { password: _, ...userWithoutPassword } = user;
    return { ...userWithoutPassword };
  }

  private async createStudent(createStudentDto: CreateUserDto, password: string) {
    await this.validateDataStudent(createStudentDto);

    const student = this.studentRepository.create({
      // Campos heredados de User
      email: createStudentDto.email,
      password: password,
      firstName: createStudentDto.firstName,
      lastName: createStudentDto.lastName,
      role: createStudentDto.role,
      // Campos específicos de Student
      studentId: createStudentDto.studentId,
      career: createStudentDto.career,
      status: createStudentDto.studentStatus,
    });

    return await this.studentRepository.save(student);
  }

  private async validateDataStudent(createStudentDto: CreateUserDto) {
    const { studentId } = createStudentDto;

    if (studentId) {
      const existingStudent = await this.studentRepository.findOne({
        where: { studentId },
      });

      if (existingStudent) {
        throw new BadRequestException(
          `El estudiante con ID: ${studentId} ya existe`,
        );
      }
    }
    return true;
  }

  private async createProfessor(createProfessorDto: CreateUserDto, password: string) {
    await this.validateDataProfessor(createProfessorDto);

    const professor = this.professorRepository.create({
      // Campos heredados de User
      email: createProfessorDto.email,
      password: password,
      firstName: createProfessorDto.firstName,
      lastName: createProfessorDto.lastName,
      role: createProfessorDto.role,
      // Campos específicos de Professor
      professorCode: createProfessorDto.professorCode,
      department: createProfessorDto.department,
      status: createProfessorDto.professorStatus,
    });

    return await this.professorRepository.save(professor);
  }

  private async validateDataProfessor(createProfessorDto: CreateUserDto) {
    const { professorCode } = createProfessorDto;

    if (professorCode) {
      const existingProfessorByCode = await this.professorRepository.findOne({
        where: { professorCode },
      });

      if (existingProfessorByCode) {
        throw new BadRequestException(
          `El docente con código: ${professorCode} ya existe`,
        );
      }
    }

    return true;
  }

  private async createAdmin(createAdminDto: CreateUserDto, password: string) {
    const admin = this.adminRepository.create({
      // Campos heredados de User
      email: createAdminDto.email,
      password: password,
      firstName: createAdminDto.firstName,
      lastName: createAdminDto.lastName,
      role: createAdminDto.role,
      // Campos específicos de Admin
      isActive: true,
    });
    return await this.adminRepository.save(admin);
  }
}
