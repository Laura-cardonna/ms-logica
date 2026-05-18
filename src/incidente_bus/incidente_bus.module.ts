import { Module } from '@nestjs/common'; // 👈 Corregido de @nestjs/module a @nestjs/common
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidenteBusService } from './incidente_bus.service';
import { IncidenteBusController } from './incidente_bus.controller';
import { IncidenteBus } from './entities/incidente_bus.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import { Foto } from 'src/foto/entities/foto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncidenteBus, Turno, Foto])
  ],
  controllers: [IncidenteBusController],
  providers: [IncidenteBusService],
  exports: [IncidenteBusService]
})
export class IncidenteBusModule {}