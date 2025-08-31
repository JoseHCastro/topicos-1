import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { JwtPayload } from '../interfaces';

/**
 * Servicio de gestión de cache de tokens para implementar JWT stateless
 * con capacidad de revocación y blacklist.
 */
@Injectable()
export class TokenCacheService implements OnModuleDestroy {
  private blacklistedTokens = new Map<string, number>();
  private userTokens = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredTokens();
      },
      15 * 60 * 1000,
    );
  }

  /**
   * Marca un token como revocado (blacklist)
   */
  revokeToken(jti: string, exp: number): void {
    this.blacklistedTokens.set(jti, exp);
  }

  /**
   * Revoca todos los tokens de un usuario específico
   * Útil para logout de todas las sesiones
   */
  revokeAllUserTokens(userId: string): void {
    const userJtis = this.userTokens.get(userId);
    if (userJtis) {
      const expTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

      userJtis.forEach((jti) => {
        this.blacklistedTokens.set(jti, expTime);
      });

      this.userTokens.delete(userId);
    }
  }

  /**
   * Verifica si un token está revocado
   */
  isTokenRevoked(jti: string): boolean {
    return this.blacklistedTokens.has(jti);
  }

  /**
   * Registra un nuevo token emitido
   */
  registerToken(payload: JwtPayload): void {
    const { id: userId, jti } = payload;

    if (!this.userTokens.has(userId)) {
      this.userTokens.set(userId, new Set());
    }

    this.userTokens.get(userId)!.add(jti);
  }

  /**
   * Limpia tokens expirados de la blacklist
   */
  private cleanupExpiredTokens(): void {
    const now = Math.floor(Date.now() / 1000);

    for (const [jti, exp] of this.blacklistedTokens.entries()) {
      if (exp < now) {
        this.blacklistedTokens.delete(jti);
      }
    }

    console.log(
      `[TokenCache] Limpieza completada. Tokens en blacklist: ${this.blacklistedTokens.size}`,
    );
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    return {
      blacklistedTokens: this.blacklistedTokens.size,
      activeUsers: this.userTokens.size,
      totalUserTokens: Array.from(this.userTokens.values()).reduce(
        (sum, tokens) => sum + tokens.size,
        0,
      ),
    };
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
