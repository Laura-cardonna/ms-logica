import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { runSeeds } from './seeds';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ejecutar seeders automáticamente
  const dataSource = app.get(DataSource);
  if (dataSource && dataSource.isInitialized) {
    console.log('\n🌱 Running database seeders...\n');
    try {
      await runSeeds(dataSource);
    } catch (error) {
      console.error('⚠ Error running seeders:', error);
    }
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ Application running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
