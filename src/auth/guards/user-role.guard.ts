import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { JwtPayload, ValidRoles } from '../interfaces';
import { META_ROLES } from '../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Get roles defined at method or controller level
    const validRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      META_ROLES,
      [context.getHandler(), context.getClass()],
    );

    // If no roles metadata, allow access
    if (!validRoles || validRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtPayload | undefined;

    if (!user) throw new BadRequestException('User not found');

    // Normalize roles to avoid case/whitespace issues
    const userRoles = [user.role, ...(user.roles || [])]
      .filter(Boolean)
      .map((r) => String(r).toUpperCase().trim());
    const requiredRoles = validRoles.map((r) => String(r).toUpperCase().trim());

    // Global override: ADMIN can do everything
    if (userRoles.includes(ValidRoles.ADMIN)) return true;

    // Check any match with required roles
    if (userRoles.some((r) => requiredRoles.includes(r))) return true;

    throw new ForbiddenException(
      `User ${user.first_name} need a valid role: [${validRoles}]`,
    );
  }
}
