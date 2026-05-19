import { Module } from '@nestjs/common';
import { BoletoService } from './boleto.service';
import { BoletoController } from './boleto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Boleto } from './entities/boleto.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';
import { Turno } from 'src/turno/entities/turno.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Boleto,
      Ciudadano,
      Programacion,
      MetodoPagoCiudadano,
      Validacion,
      RutaParadero,
      Turno,
    ]),
  ],
  controllers: [BoletoController],
  providers: [BoletoService],
})
export class BoletoModule {}