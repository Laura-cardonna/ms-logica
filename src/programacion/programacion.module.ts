import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramacionService } from './programacion.service';
import { ProgramacionController } from './programacion.controller';
import { Programacion } from './entities/programacion.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Programacion, Bus, Ruta])],
  controllers: [ProgramacionController],
  providers: [ProgramacionService],
  exports: [ProgramacionService],
})
export class ProgramacionModule {}
