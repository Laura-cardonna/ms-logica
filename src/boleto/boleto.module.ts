import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoletoService } from './boleto.service';
import { BoletoController } from './boleto.controller';
import { Boleto } from './entities/boleto.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Boleto,
      Ciudadano,
      Programacion,
      MetodoPagoCiudadano,
      Ruta,
      Bus,
      Paradero,
    ]),
  ],
  controllers: [BoletoController],
  providers: [BoletoService],
})
export class BoletoModule {}
