import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { runSeeds } from './seeds';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Proyecto buses')
    .setDescription('API del sistema de buses inteligentes')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);
  
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
