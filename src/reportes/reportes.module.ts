import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { Boleto } from '../boleto/entities/boleto.entity';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';
import { Ruta } from '../ruta/entities/ruta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Boleto, Ciudadano, Ruta])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}