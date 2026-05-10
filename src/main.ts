import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express'; // <--- AGREGAR
import { join } from 'path'; // <--- AGREGAR

async function bootstrap() {
  // Cambiamos a NestExpressApplication para usar useStaticAssets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors();

  // SERVIR ARCHIVOS ESTÁTICOS (Para las fotos)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ... (Configuración de Swagger igual que antes)

  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ Application running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();