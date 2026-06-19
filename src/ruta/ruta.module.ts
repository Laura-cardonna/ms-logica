import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutaService } from './ruta.service';
import { RutaController } from './ruta.controller';
import { Ruta } from './entities/ruta.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';
import { Nodo } from 'src/nodo/entities/nodo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ruta, RutaParadero, Paradero, Nodo])],
  controllers: [RutaController],
  providers: [RutaService],
  exports: [RutaService],
})
export class RutaModule {}
