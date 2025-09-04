import { Controller, Get, Post, Body, Patch, Put, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { Auth, GetUser } from './decorators';
import { User } from './entities';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.authService.create(createUserDto);
  }

  @Post('login')
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.login(loginUserDto);
  }

  /**
   * Obtener todos los usuarios del sistema
   */
  @Get('users')
  @Auth() // Requiere autenticación
  async getAllUsers() {
    return await this.authService.findAllUsers();
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(@GetUser() user: JwtPayload) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      roles: user.roles,
      phone: user.phone,
    };
  }

  @Patch('update-user')
  @Auth()
  update(@GetUser() user: JwtPayload, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.update(user.id, updateUserDto);
  }

  @Put('change-password')
  @Auth()
  changePassword(
    @GetUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  /**
   * Logout específico - revoca el token actual
   */
  @Post('logout')
  @Auth()
  async logout(@GetUser() user: JwtPayload) {
    await this.authService.logout(user.jti, user.exp);
    return { message: 'Logout successful' };
  }

  /**
   * Logout de todas las sesiones - revoca todos los tokens del usuario
   */
  @Post('logout-all')
  @Auth()
  async logoutAll(@GetUser() user: JwtPayload) {
    await this.authService.logoutAll(user.id);
    return { message: 'All sessions logged out successfully' };
  }
}
