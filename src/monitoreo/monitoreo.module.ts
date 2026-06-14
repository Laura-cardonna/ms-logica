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

@Module({
  imports: [
    TypeOrmModule.forFeature([UbicacionBus, Bus, Ruta, Paradero, Programacion]),
    HttpModule,
  ],
  controllers: [MonitoreoController],
  providers: [MonitoreoService, MonitoreoGateway], // Agrega el gateway a los providers
  exports: [MonitoreoService, MonitoreoGateway], // Exporta el servicio y el gateway para que puedan ser usados en otros módulos
})
export class MonitoreoModule {}