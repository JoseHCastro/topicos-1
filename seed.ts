import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './src/app.module';
import { SeedModule } from './src/seed/seed.module';
import { SeedService } from './src/seed/seed.service';

async function bootstrap() {
  const logger = new Logger('SeedScript');
  
  try {
    // Crear la aplicación NestJS
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Obtener el módulo de seeders
    const seedModule = app.select(SeedModule);
    const seedService = seedModule.get(SeedService);
    
    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    const command = args[0];
    const seederName = args[1];
    
    logger.log('🚀 Starting seed script...');
    
    switch (command) {
      case 'run':
        if (seederName) {
          await seedService.runSpecificSeeder(seederName);
        } else {
          await seedService.runAllSeeders();
        }
        break;
        
      case 'clear':
        await seedService.clearDatabase();
        break;
        
      case 'fresh':
        logger.log('🔄 Running fresh seed (clear + seed)...');
        await seedService.clearDatabase();
        await seedService.runAllSeeders();
        break;
        
      default:
        logger.log('📋 Available commands:');
        logger.log('  npm run seed run          - Run all seeders');
        logger.log('  npm run seed run <name>   - Run specific seeder (user, admin, professor, student)');
        logger.log('  npm run seed clear        - Clear all data');
        logger.log('  npm run seed fresh        - Clear and re-seed all data');
        break;
    }
    
    await app.close();
    logger.log('✨ Seed script completed!');
    process.exit(0);
    
  } catch (error) {
    logger.error('💥 Seed script failed:', error);
    process.exit(1);
  }
}

bootstrap();
