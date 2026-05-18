import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutaParaderoService } from './ruta_paradero.service';
import { RutaParaderoController } from './ruta_paradero.controller';
import { RutaParadero } from './entities/ruta_paradero.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RutaParadero])],
  controllers: [RutaParaderoController],
  providers: [RutaParaderoService],
  exports: [RutaParaderoService], // Exportamos para que otros módulos puedan usarlo si es necesario
})
export class RutaParaderoModule {}