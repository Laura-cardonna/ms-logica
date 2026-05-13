import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutaParaderoService } from './ruta_paradero.service';
import { RutaParaderoController } from './ruta_paradero.controller';
import { RutaParadero } from './entities/ruta_paradero.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RutaParadero, Ruta, Paradero])],
    controllers: [RutaParaderoController],
    providers: [RutaParaderoService],
    exports: [RutaParaderoService],
})
export class RutaParaderoModule {}
