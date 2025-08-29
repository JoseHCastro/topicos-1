import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedModule } from './src/seed/seed.module';
import { SeedService } from './src/seed/seed.service';

async function bootstrap() {
  const logger = new Logger('SeedScript');
  
  try {
    logger.log('Starting seed script...');
    
    const app = await NestFactory.createApplicationContext(SeedModule);
    const seedService = app.get(SeedService);

    const command = process.argv[2];

    switch (command) {
      case 'fresh':
        logger.log('Running fresh seed (clear + seed)...');
        await seedService.clearAllData();
        await seedService.runAllSeeders();
        break;
        
      case 'run':
        logger.log('Running seed...');
        await seedService.runAllSeeders();
        break;
        
      case 'clear':
        logger.log('Clearing data...');
        await seedService.clearAllData();
        break;
        
      default:
        logger.error('Invalid command. Use: fresh, run, or clear');
        process.exit(1);
    }

    logger.log('✅ Seed script completed successfully!');
    await app.close();
    
  } catch (error) {
    logger.error('💥 Seed script failed:');
    logger.error(error);
    process.exit(1);
  }
}

bootstrap();