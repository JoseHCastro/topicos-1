import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student, User, Teacher, Admin } from './entities';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenCacheService } from './services/token-cache.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenCacheService],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Student, Teacher, Admin]),
    PassportModule.register({ 
      defaultStrategy: 'jwt'
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),          
        };
      },
    }),
  ],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule, TokenCacheService],
})
export class AuthModule {}
