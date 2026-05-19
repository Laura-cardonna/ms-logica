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
import { CiudadanoModule } from 'src/ciudadano/ciudadano.module'; 
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
      Ruta,
      Bus,
      Paradero,
      Validacion,
      RutaParadero,
      Turno,
    ]),
    CiudadanoModule, // <--- AGREGAR AQUÍ para que el Guard vea el CiudadanoService
  ],
  controllers: [BoletoController],
  providers: [BoletoService],
  exports: [BoletoService], // Por si otro módulo necesita usarlo después
})
export class BoletoModule {}