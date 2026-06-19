import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClimaOrquestadorService } from './clima.orquestador.service';

@Injectable()
export class ClimaScheduler {
  private readonly logger = new Logger(ClimaScheduler.name);

  constructor(private readonly orquestador: ClimaOrquestadorService) {}

  // Cada hora en punto. El service filtra la ventana de 2 h previa al horario de
  // viaje de cada suscriptor (HU: "máximo 2 h antes") y evita duplicados del día,
  // así un solo cron horario cubre el caso de las 6:00 AM sin spamear.
  @Cron('0 * * * *')
  async ejecutarCron() {
    this.logger.log('Ejecutando cron de alertas de clima...');
    await this.orquestador.ejecutar();
  }
}
