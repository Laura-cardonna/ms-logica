import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { MensajeGateway } from './mensaje.gateway';
import { NotificacionService } from 'src/notificacion/notificacion.service';
import { BoletoService } from 'src/boleto/boleto.service';
import { Persona } from 'src/persona/entities/persona.entity';

@Injectable()
export class AlertaSchedulerService {
  constructor(
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,
    private readonly mensajeGateway: MensajeGateway,
    private readonly notificacionService: NotificacionService,
    private readonly boletoService: BoletoService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async procesarAlertasProgramadas() {
    const ahora = new Date();
    console.log(`[Scheduler] Verificando alertas programadas a las ${ahora.toISOString()}`);

    try {
      const alertasPendientes = await this.mensajeRepository
        .createQueryBuilder('m')
        .where('m.alcance_tipo IS NOT NULL')
        .andWhere('m.programado_para IS NOT NULL')
        .andWhere('m.programado_para <= :ahora', { ahora })
        .andWhere('m.deleted_at IS NULL')
        .getMany();

      console.log(`[Scheduler] Alertas pendientes encontradas: ${alertasPendientes.length}`);

      for (const alerta of alertasPendientes) {
        console.log(`[Scheduler] Procesando alerta #${alerta.id}`);

        const destinatarios = await this.boletoService.obtenerDestinatariosAlerta(
          alerta.alcanceTipo!,
          alerta.alcanceId ?? undefined,
        );

        for (const ciudadano of destinatarios) {
          await this.notificacionService.crearNotificacion(
            { id: ciudadano.id } as Persona,
            `🚨 ALERTA#${alerta.id}`,
            alerta.contenido!,
          ).catch((err) => console.error(`[Scheduler] Error push usuario ${ciudadano.id}:`, err));
        }

        this.mensajeGateway.emitirAlertaMasiva(
          {
            id: alerta.id!,
            contenido: alerta.contenido!,
            esUrgente: !!alerta.esUrgente,
            alcanceTipo: alerta.alcanceTipo!,
            fechaEnvio: ahora,
            emisorId: '',
          },
          alerta.alcanceTipo === 'TODOS' ? [] : destinatarios.map((d: any) => d.id),
        );

        await this.mensajeRepository
          .createQueryBuilder()
          .update(Mensaje)
          .set({ programadoPara: null as any })
          .where('id = :id', { id: alerta.id })
          .execute();

        console.log(`[Scheduler] Alerta #${alerta.id} procesada y marcada.`);
      }
    } catch (error) {
      console.error('[Scheduler] Error procesando alertas:', error);
    }
  }
}