import { Module } from '@nestjs/common';
import { RutaParaderoService } from './ruta_paradero.service';
import { RutaParaderoController } from './ruta_paradero.controller';

@Module({
    controllers: [RutaParaderoController],
    providers: [RutaParaderoService],
})
export class RutaParaderoModule {}
