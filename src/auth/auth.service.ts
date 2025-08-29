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
import { TokenCacheService } from './services/token-cache.service';
import { v4 as uuidv4 } from 'uuid';

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
    private readonly tokenCacheService: TokenCacheService,
  ) {}
  
  async create(createUserDto: CreateUserDto) {
    const { email, password, role } = createUserDto;

    console.log(' DEBUG Backend - Datos recibidos en create:', {
      createUserDto,
      email,
      role,
      expectedStudent: 'STUDENT',
      expectedTeacher: 'TEACHER',
      isStudent: role === UserRole.STUDENT,
      isTeacher: role === UserRole.TEACHER
    });

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException(`El usuario con email ${email} ya existe`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    
    if (role === UserRole.STUDENT) {
      console.log(' Creando STUDENT');
      const student = await this.createStudent(createUserDto, hashedPassword);
      return {
        user: this.parseUser(student),
        token: this.getJwtToken(student),
      };
    }

    if (role === UserRole.TEACHER) {
      console.log(' Creando TEACHER');
      const teacher = await this.createTeacher(createUserDto, hashedPassword);
      return {
        user: this.parseUser(teacher),
        token: this.getJwtToken(teacher),
      };
    }

    if (role === UserRole.ADMIN) {
      console.log(' Creando ADMIN');
      const admin = await this.createAdmin(createUserDto, hashedPassword);
      return {
        user: this.parseUser(admin),
        token: this.getJwtToken(admin),
      };
    }

    throw new BadRequestException(`Rol ${role} no válido`);
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true, first_name: true, last_name: true, user_type: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credentials are not valid (email)');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Credentials are not valid (password)');
    }

    const fullUser = await this.loadFullUserInfo(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      token: this.getJwtToken(fullUser),
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
      token: this.getJwtToken(user),
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

  /**
   * Genera un JWT STATELESS con toda la información del usuario
   */
  private getJwtToken(user: User | Student | Teacher | Admin): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (24 * 60 * 60); // 24 horas
    const jti = uuidv4();
    
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.user_type, 
      roles: [user.user_type],
      iat: now,
      exp: exp,
      jti: jti,
    };
    
    if (user.user_type === 'STUDENT' && 'code' in user) {
      payload.student_code = (user as Student).code;
    }

    if (user.user_type === 'TEACHER' && 'category' in user) {
      payload.teacher_category = (user as Teacher).category;
    }
    
    this.tokenCacheService.registerToken(payload);

    const token = this.jwtService.sign(payload);
    return token;
  }

  /**
   * Carga información completa del usuario basada en su tipo
   */
  private async loadFullUserInfo(user: User): Promise<User | Student | Teacher | Admin> {
    switch (user.user_type) {
      case 'STUDENT':
        const student = await this.studentRepository.findOne({ where: { id: user.id } });
        return student || user;
      case 'TEACHER':
        const teacher = await this.teacherRepository.findOne({ where: { id: user.id } });
        return teacher || user;
      case 'ADMIN':
        const admin = await this.adminRepository.findOne({ where: { id: user.id } });
        return admin || user;
      default:
        return user;
    }
  }

  /**
   * Revoca un token específico (logout)
   */
  async logout(jti: string, exp: number): Promise<void> {
    this.tokenCacheService.revokeToken(jti, exp);
  }

  /**
   * Revoca todos los tokens de un usuario (logout de todas las sesiones)
   */
  async logoutAll(userId: string): Promise<void> {
    this.tokenCacheService.revokeAllUserTokens(userId);
  }

  private parseUser(user: User) {
    
    const { password, user_type, ...userWithoutPassword } = user as any;   
    
    return { 
      ...userWithoutPassword,
      role: user_type 
    };
  }

  private async createStudent(createStudentDto: CreateUserDto, password: string) {
    
    await this.validateDataStudent(createStudentDto);    
    const student = this.studentRepository.create({
      
      email: createStudentDto.email,
      password: password,
      first_name: createStudentDto.firstName,
      last_name: createStudentDto.lastName,
      phone: createStudentDto.phone,
      user_type: createStudentDto.role, 
      
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
    return true;
  }

  private async createTeacher(createTeacherDto: CreateUserDto, password: string) {
    
    await this.validateDataTeacher(createTeacherDto);
    
    const teacher = this.teacherRepository.create({      
      email: createTeacherDto.email,
      password: password,
      first_name: createTeacherDto.firstName,
      last_name: createTeacherDto.lastName,
      phone: createTeacherDto.phone,
      user_type: createTeacherDto.role,       
      category: createTeacherDto.department || 'Regular',
      workload: 'FullTime',
      contract_type: 'Permanent',
      hired_at: new Date(),
    });

    return await this.teacherRepository.save(teacher);
  }

  private async validateDataTeacher(createTeacherDto: CreateUserDto) {    
    return true;
  }

  private async createAdmin(createAdminDto: CreateUserDto, password: string) {
    const admin = this.adminRepository.create({
      
      email: createAdminDto.email,
      password: password,
      first_name: createAdminDto.firstName,
      last_name: createAdminDto.lastName,
      phone: createAdminDto.phone,
      user_type: createAdminDto.role, 
    });
    return await this.adminRepository.save(admin);
  }
}
