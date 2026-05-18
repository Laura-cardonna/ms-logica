import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { Turno } from './entities/turno.entity'; 
import { Programacion } from 'src/programacion/entities/programacion.entity'; 
import { Bus } from 'src/bus/entities/bus.entity'; 
import { Conductor } from 'src/conductor/entities/conductor.entity'; 

@Module({
  imports: [
    // Registramos todas las entidades en este módulo para que TypeORM nos permita usar sus Repositorios
    TypeOrmModule.forFeature([Turno, Programacion, Bus, Conductor]) 
  ],
  controllers: [TurnoController],
  providers: [TurnoService],
  exports: [TurnoService] // Opcional: por si necesitas usar este servicio en otro módulo más adelante
})
export class TurnoModule {}