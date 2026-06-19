import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AlertaClima } from './entities/alerta-clima.entity';
import { AlertaClimaService, ClimaPronostico } from './alerta-clima.service';
import { construirGrafoClima } from './clima.graph';

@Injectable()
export class ClimaOrquestadorService {
  private readonly logger = new Logger(ClimaOrquestadorService.name);

  constructor(
    private readonly alertaService: AlertaClimaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Construye e invoca el grafo LangGraph. Lo usan el cron y el endpoint /run.
   * `forzar=true` (botón "Probar ahora") ignora la ventana de 2h y el anti-dup:
   * envía a TODAS las alertas activas, para demo/verificación inmediata. El cron
   * llama sin forzar, respetando la ventana.
   */
  async ejecutar(forzar = false) {
    const grafo = construirGrafoClima({
      getPendientes: () =>
        forzar
          ? this.alertaService.listarActivas()
          : this.alertaService.findPendientes(),
      fetchClima: (pendientes) => this.fetchClima(pendientes),
      enviar: (pendientes, pronosticos) => this.enviar(pendientes, pronosticos),
    });

    const res = (await grafo.invoke({
      pendientes: [],
      pronosticos: {},
      enviados: 0,
    })) as { pendientes: AlertaClima[]; enviados: number };

    this.logger.log(
      `Clima ejecutado: ${res.pendientes.length} pendientes, ${res.enviados} notificados`,
    );
    return { pendientes: res.pendientes.length, enviados: res.enviados };
  }

  /** Nodo fetchClima: una llamada a OpenWeatherMap por ciudad (deduplicada). */
  private async fetchClima(
    pendientes: AlertaClima[],
  ): Promise<Record<string, ClimaPronostico>> {
    const out: Record<string, ClimaPronostico> = {};
    const ciudades = [
      ...new Set(pendientes.map((p) => p.ciudad).filter(Boolean) as string[]),
    ];
    const key = this.config.get<string>('OPENWEATHER_API_KEY');
    if (!key) {
      this.logger.warn('OPENWEATHER_API_KEY no configurada; no se consulta el clima');
      return out;
    }

    for (const ciudad of ciudades) {
      try {
        const { data } = await axios.get(
          'https://api.openweathermap.org/data/2.5/forecast',
          { params: { q: ciudad, appid: key, units: 'metric', lang: 'es', cnt: 8 } },
        );
        const bloques: any[] = data?.list ?? [];
        const probLluvia = Math.round(
          Math.max(0, ...bloques.map((b) => b?.pop ?? 0)) * 100,
        );
        const temp = Math.round(bloques[0]?.main?.temp ?? 0);
        const condicion = bloques[0]?.weather?.[0]?.description ?? 'desconocido';
        out[ciudad] = { ciudad, temp, probLluvia, condicion };
      } catch (e) {
        this.logger.error(`Error consultando clima de ${ciudad}: ${(e as Error).message}`);
      }
    }
    return out;
  }

  /** Nodo enviar: por cada suscriptor, manda por su canal y marca como notificado. */
  private async enviar(
    pendientes: AlertaClima[],
    pronosticos: Record<string, ClimaPronostico>,
  ): Promise<number> {
    const url = this.config.get<string>('MS_NOTIFICACIONES_URL');
    if (!url) {
      this.logger.warn('MS_NOTIFICACIONES_URL no configurada; no se envían alertas');
      return 0;
    }
    const telegramToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');

    let enviados = 0;
    for (const a of pendientes) {
      const pronostico = pronosticos[a.ciudad ?? ''];
      if (!pronostico) continue; // sin datos de clima para esa ciudad → se omite
      const msg = this.alertaService.construirMensaje(pronostico);
      try {
        if (a.canal === 'telegram' && a.telegramChatId) {
          if (!telegramToken) {
            this.logger.warn(
              `TELEGRAM_BOT_TOKEN no configurado; no se envía Telegram a ${a.telegramChatId}`,
            );
            continue;
          }
          await axios.post(`${url}/api/enviar-telegram`, {
            chat_id: a.telegramChatId,
            mensaje: `${msg.pronostico}\n${msg.recomendacion}`,
            token: telegramToken,
          });
        } else {
          await axios.post(`${url}/api/enviar-clima`, {
            destinatario: a.email,
            asunto: msg.lluvia
              ? '🌧️ Alerta de clima para tu viaje'
              : '☀️ Clima de hoy',
            pronostico: msg.pronostico,
            recomendacion: msg.recomendacion,
          });
        }
        await this.alertaService.marcarNotificada(a.id!);
        enviados++;
      } catch (e) {
        this.logger.error(`Error enviando alerta ${a.id}: ${(e as Error).message}`);
      }
    }
    return enviados;
  }
}
