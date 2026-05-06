import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutaParadero } from './entities/ruta_paradero.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RutaParadero])],
    controllers: [],
    providers: [],
    exports: [TypeOrmModule],
})
export class RutaParaderoModule {}
