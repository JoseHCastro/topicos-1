import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level, Term } from './entities';
import { LevelService, TermService } from './services';
import { LevelController, TermController } from './controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Level, Term]),
    AuthModule,
  ],
  controllers: [LevelController, TermController],
  providers: [LevelService, TermService],
  exports: [TypeOrmModule, LevelService, TermService],
})
export class CatalogsModule {}