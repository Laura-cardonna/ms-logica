import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConductorService } from './conductor.service';
import { ConductorController } from './conductor.controller';
import { Conductor } from './entities/conductor.entity'; 
import { Turno } from 'src/turno/entities/turno.entity'; // Importamos la entidad Turno para las relaciones

@Module({
  imports: [
    TypeOrmModule.forFeature([Conductor, Turno]) // 👈 Esto es obligatorio para que funcione el repositorio
  ],
  controllers: [ConductorController],
  providers: [ConductorService],
  exports: [ConductorService] // Por si acaso lo necesitas en otro lado
})
export class ConductorModule {}