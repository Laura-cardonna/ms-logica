import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiudadanoService } from './ciudadano.service';
import { CiudadanoController } from './ciudadano.controller';
import { Ciudadano } from './entities/ciudadano.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ciudadano])
  ],
  controllers: [CiudadanoController],
  providers: [CiudadanoService],
  // Esto permite que el JwtAuthGuard (en Boletos o cualquier otro módulo) 
  // pueda usar el CiudadanoService para registrar a la gente automáticamente.
  exports: [CiudadanoService] 
})
export class CiudadanoModule {}