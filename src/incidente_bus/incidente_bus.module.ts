import { Module } from '@nestjs/common';
import { IncidenteBusService } from './incidente_bus.service';
import { IncidenteBusController } from './incidente_bus.controller';

@Module({
  controllers: [IncidenteBusController],
  providers: [IncidenteBusService],
})
export class IncidenteBusModule {}
