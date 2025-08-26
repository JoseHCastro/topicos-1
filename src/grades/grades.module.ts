import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from './entities';
import { GradeService } from './services';
import { GradeController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grade]),
    AuthModule,
  ],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [TypeOrmModule, GradeService],
})
export class GradesModule {}