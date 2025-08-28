import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { META_ROLES } from '../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validRoles) {
      return true;
    }

    if (validRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtPayload; // Ahora es JwtPayload, no User

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verificar rol principal
    if (validRoles.includes(user.role)) { // ✅ CORREGIDO: usar 'role' en lugar de 'user_type'
      return true;
    }

    // Verificar roles adicionales (para futuras expansiones)
    if (user.roles && user.roles.some(role => validRoles.includes(role))) {
      return true;
    }

    throw new ForbiddenException(
      `User ${user.first_name} need a valid role: [${validRoles}]`,
    );
  }
}
