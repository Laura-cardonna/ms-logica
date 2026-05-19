import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialService } from './historial.service';
import { HistorialController } from './historial.controller';
import { Historial } from './entities/historial.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Historial,
      Validacion,
      Paradero,
      Boleto,
      Ruta,
      RutaParadero,
    ]),
  ],
  controllers: [HistorialController],
  providers: [HistorialService],
  exports: [HistorialService],
})
export class HistorialModule {}
