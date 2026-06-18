import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MonitoreoController } from './monitoreo.controller';
import { MonitoreoService } from './monitoreo.service';
import { UbicacionBus } from './entities/ubicacion-bus.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Ruta } from '../ruta/entities/ruta.entity';
import { Paradero } from '../paradero/entities/paradero.entity';
import { Programacion } from '../programacion/entities/programacion.entity';
import { MonitoreoGateway } from './monitore.gateway';
import { IncidenteBus } from '../incidente_bus/entities/incidente_bus.entity'; // 👈 1. IMPORTACIÓN CORREGIDA: Ajusta la ruta relativa exacta según tu árbol de directorios
import { Boleto } from '../boleto/entities/boleto.entity'; // HU-3-002: pasajeros en tránsito
import { Incidente } from '../incidente/entities/incidente.entity'; // HU-3-002: estado de resolución del incidente

@Module({
  imports: [
    // 👈 2. MATRIZ EN FORMATO JSON DE ENTIDADES ACTUALIZADA PARA CUMPLIR CON HU-ENTR-3-002
    TypeOrmModule.forFeature([
      UbicacionBus,
      Bus,
      Ruta,
      Paradero,
      Programacion,
      IncidenteBus, // 👈 SOLUCIÓN: Agregado a la base de datos del módulo de monitoreo
      Boleto,       // HU-3-002: conteo de pasajeros en tránsito y ocupación
      Incidente,    // HU-3-002: filtra incidentes no resueltos por estado del padre
    ]),
    HttpModule,
  ],
  controllers: [MonitoreoController],
  providers: [MonitoreoService, MonitoreoGateway], 
  exports: [MonitoreoService, MonitoreoGateway], 
})
export class MonitoreoModule {}