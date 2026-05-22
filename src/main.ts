import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express'; 
import { join } from 'path'; 
import * as express from 'express';

async function bootstrap() {
  // Instanciamos usando NestExpressApplication para el soporte de assets estáticos
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 🔥 SOLUCIÓN AL ERROR 413: Ampliar la capacidad para recibir strings Base64 de las imágenes
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.enableCors();

  // SERVIR ARCHIVOS ESTÁTICOS (Para las fotos de evidencias)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ... (Tu configuración de Swagger se mantiene exactamente igual aquí abajo)

  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ Application running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();