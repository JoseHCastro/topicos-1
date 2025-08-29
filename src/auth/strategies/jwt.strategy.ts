import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenCacheService } from '../services/token-cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly tokenCacheService: TokenCacheService,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_SECRET') || 'SARAMAMBICHE123',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    });
  }

  /**
   * Validación STATELESS del JWT
   * Sin consultas a base de datos
   * Verificación de blacklist en memoria
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const { jti, exp, id } = payload;

    if (!id) {
      throw new UnauthorizedException('Token payload is invalid');
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) {
      throw new UnauthorizedException('Token expired');
    }
    
    if (!jti) {
      throw new UnauthorizedException('Invalid token format - missing JTI');
    }

    if (this.tokenCacheService.isTokenRevoked(jti)) {
      throw new UnauthorizedException('Token has been revoked');
    }
    
    return payload;
  }
}
