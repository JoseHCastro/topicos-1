import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, User, Teacher, Admin } from './entities';
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
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
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
      isProfessor: role === UserRole.TEACHER
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
        token: this.getJwtToken({ email: student.email, id: student.id, rol: student.user_type }),
      };
    }

    if (role === UserRole.TEACHER) {
      console.log('✅ Creando TEACHER');
      const teacher = await this.createTeacher(createUserDto, hashedPassword);
      return {
        user: this.parseUser(teacher),
        token: this.getJwtToken({ email: teacher.email, id: teacher.id, rol: teacher.user_type }),
      };
    }

    if (role === UserRole.ADMIN) {
      console.log('✅ Creando ADMIN');
      const admin = await this.createAdmin(createUserDto, hashedPassword);
      return {
        user: this.parseUser(admin),
        token: this.getJwtToken({ email: admin.email, id: admin.id, rol: admin.user_type }),
      };
    }

    throw new BadRequestException(`Rol ${role} no válido`);
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true, first_name: true, user_type: true },
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
      firstName: user.first_name,
      token: this.getJwtToken({ email: user.email, id: user.id, rol: user.user_type }),
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
      token: this.getJwtToken({ email: user.email, id: user.id, rol: user.user_type }),
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
    // Removemos campos sensibles antes de retornar
    const { password, ...userWithoutPassword } = user as any;
    return { ...userWithoutPassword };
  }

  private async createStudent(createStudentDto: CreateUserDto, password: string) {
    const student = this.studentRepository.create({
      // Campos heredados de User
      email: createStudentDto.email,
      password: password,
      first_name: createStudentDto.firstName,
      last_name: createStudentDto.lastName,
      user_type: 'Student',
      // Campos específicos de Student
      code: createStudentDto.studentCode,
      enrolled_at: new Date(),
      birth_date: createStudentDto.birthDate,
      sex: 'M',
    });

    return await this.studentRepository.save(student);
  }

  private async validateDataStudent(createStudentDto: CreateUserDto) {
    const { studentCode, nationalId } = createStudentDto;

    if (studentCode) {
      const existingStudent = await this.studentRepository.findOne({
        where: { code: studentCode },
      });

      if (existingStudent) {
        throw new BadRequestException(
          `El estudiante con código: ${studentCode} ya existe`,
        );
      }
    }

    // Temporalmente comentado
    /*
    if (nationalId) {
      const existingStudentByNationalId = await this.studentRepository.findOne({
        where: { nationalId },
      });

      if (existingStudentByNationalId) {
        throw new BadRequestException(
          `El estudiante con CI: ${nationalId} ya existe`,
        );
      }
    }
    */
    return true;
  }

  private async createTeacher(createTeacherDto: CreateUserDto, password: string) {
    const teacher = this.teacherRepository.create({
      // Campos heredados de User
      email: createTeacherDto.email,
      password: password,
      first_name: createTeacherDto.firstName,
      last_name: createTeacherDto.lastName,
      user_type: 'Teacher',
      // Campos específicos de Teacher
      category: 'Regular',
      workload: 'FullTime',
      contract_type: 'Permanent',
      hired_at: new Date(),
    });

    return await this.teacherRepository.save(teacher);
  }

  private async validateDataTeacher(createTeacherDto: CreateUserDto) {
    // Validaciones temporalmente removidas
    return true;
  }

  private async createAdmin(createAdminDto: CreateUserDto, password: string) {
    const admin = this.adminRepository.create({
      // Campos heredados de User
      email: createAdminDto.email,
      password: password,
      first_name: createAdminDto.firstName,
      last_name: createAdminDto.lastName,
      user_type: 'Admin',
    });
    return await this.adminRepository.save(admin);
  }
}
