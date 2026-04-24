import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmpresaModule } from './empresa/empresa.module';
import { BusModule } from './bus/bus.module';
import { GpsModule } from './gps/gps.module';
import { ConductorModule } from './conductor/conductor.module';
import { TurnoModule } from './turno/turno.module';
import { ProgramacionModule } from './programacion/programacion.module';
import { MetodoPagoModule } from './metodo_pago/metodo_pago.module';
import { MetodoPagoCiudadanoModule } from './metodo_pago_ciudadano/metodo_pago_ciudadano.module';
import { BoletoModule } from './boleto/boleto.module';
import { IncidenteModule } from './incidente/incidente.module';
import { IncidenteBusModule } from './incidente_bus/incidente_bus.module';
import { FotoModule } from './foto/foto.module';

@Module({
  imports: [EmpresaModule, BusModule, GpsModule, ConductorModule, TurnoModule, ProgramacionModule, MetodoPagoModule, MetodoPagoCiudadanoModule, BoletoModule, IncidenteModule, IncidenteBusModule, FotoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
