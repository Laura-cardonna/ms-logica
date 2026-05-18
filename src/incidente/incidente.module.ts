import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidenteService } from './incidente.service';
import { IncidenteController } from './incidente.controller';
import { Incidente } from './entities/incidente.entity';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity'; // 👈 Asegura esta ruta

@Module({
  imports: [
    // 🚨 ESTO REGISTRA LOS REPOSITORIOS PARA QUE NEST LOS PUEDA INYECTAR
    TypeOrmModule.forFeature([Incidente, IncidenteBus]) 
  ],
  controllers: [IncidenteController],
  providers: [IncidenteService],
  exports: [IncidenteService] // Por si otro módulo necesita usarlo después
})
export class IncidenteModule {}