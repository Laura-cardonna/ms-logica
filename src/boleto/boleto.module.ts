import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Boleto } from './entities/boleto.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';
import { BoletoService } from './boleto.service';
import { BoletoController } from './boleto.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Boleto, Validacion, Turno, RutaParadero])
  ],
  controllers: [BoletoController],
  providers: [BoletoService],
})
export class BoletoModule {}