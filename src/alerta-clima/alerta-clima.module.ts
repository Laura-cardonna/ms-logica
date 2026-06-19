import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertaClima } from './entities/alerta-clima.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { AlertaClimaService } from './alerta-clima.service';
import { AlertaClimaController } from './alerta-clima.controller';
import { ClimaOrquestadorService } from './clima.orquestador.service';
import { ClimaScheduler } from './clima.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([AlertaClima, Persona])],
  controllers: [AlertaClimaController],
  providers: [AlertaClimaService, ClimaOrquestadorService, ClimaScheduler],
  exports: [AlertaClimaService],
})
export class AlertaClimaModule {}
