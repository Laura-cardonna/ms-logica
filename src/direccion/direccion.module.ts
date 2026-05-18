import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DireccionService } from './direccion.service';
import { DireccionController } from './direccion.controller';
import { Direccion } from './entities/direccion.entity';

@Module({
  // Importamos TypeOrmModule y le pasamos la entidad para que genere el repositorio
  imports: [TypeOrmModule.forFeature([Direccion])],
  controllers: [DireccionController],
  providers: [DireccionService],
})
export class DireccionModule {}