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

@Module({
  imports: [
    TypeOrmModule.forFeature([UbicacionBus, Bus, Ruta, Paradero, Programacion]),
    HttpModule,
  ],
  controllers: [MonitoreoController],
  providers: [MonitoreoService],
  exports: [MonitoreoService],
})
export class MonitoreoModule {}