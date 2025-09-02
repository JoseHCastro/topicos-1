import { Controller, Get, Post, Body, Patch, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { Auth, GetUser } from './decorators';
import { User } from './entities';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './interfaces';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse
} from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario en el sistema. El email debe ser único.'
  })
  @ApiBody({ 
    type: CreateUserDto,
    description: 'Datos del usuario a registrar'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'estudiante@uagrm.edu.bo' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            isActive: { type: 'boolean', example: true }
          }
        },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiConflictResponse({ description: 'El email ya está registrado' })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.authService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y retorna un token JWT para acceso a endpoints protegidos.'
  })
  @ApiBody({ 
    type: LoginUserDto,
    description: 'Credenciales de acceso'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'estudiante@uagrm.edu.bo' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            role: { type: 'string', example: 'student' }
          }
        },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Credenciales inválidas' })
  @ApiUnauthorizedResponse({ description: 'Email o contraseña incorrectos' })
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @Auth()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Verificar estado de autenticación',
    description: 'Verifica si el token JWT es válido y retorna información del usuario autenticado.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token válido',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'estudiante@uagrm.edu.bo' },
        firstName: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Pérez' },
        role: { type: 'string', example: 'student' },
        roles: { type: 'array', items: { type: 'string' }, example: ['student'] },
        phone: { type: 'string', example: '+591 12345678' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Actualizar perfil de usuario',
    description: 'Actualiza la información del perfil del usuario autenticado.'
  })
  @ApiBody({ 
    type: UpdateUserDto,
    description: 'Datos a actualizar del usuario'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Usuario actualizado exitosamente' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'estudiante@uagrm.edu.bo' },
            firstName: { type: 'string', example: 'Juan Carlos' },
            lastName: { type: 'string', example: 'Pérez García' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
  update(@GetUser() user: JwtPayload, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.update(user.id, updateUserDto);
  }

  @Put('change-password')
  @Auth()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Cambiar contraseña',
    description: 'Permite al usuario cambiar su contraseña actual por una nueva.'
  })
  @ApiBody({ 
    type: ChangePasswordDto,
    description: 'Contraseña actual y nueva contraseña'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña cambiada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Contraseña actualizada exitosamente' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos o contraseña actual incorrecta' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
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
