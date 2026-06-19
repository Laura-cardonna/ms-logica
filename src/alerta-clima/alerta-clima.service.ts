import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertaClima } from './entities/alerta-clima.entity';
import { CreateAlertaClimaDto } from './dto/create-alerta-clima.dto';
import { UpdateAlertaClimaDto } from './dto/update-alerta-clima.dto';
import { Persona } from 'src/persona/entities/persona.entity';

// Pronóstico ya normalizado (lo arma el nodo fetchClima del grafo desde OpenWeatherMap).
export interface ClimaPronostico {
  ciudad: string;
  temp: number; // °C
  probLluvia: number; // 0-100
  condicion: string; // soleado | nublado | lluvioso ...
}

export interface MensajeClima {
  lluvia: boolean;
  pronostico: string;
  recomendacion: string;
}

const VENTANA_HORAS = 2; // se avisa como máximo 2 h antes del horario de viaje
const UMBRAL_LLUVIA = 50; // % de probabilidad a partir del cual se considera "lluvia"

@Injectable()
export class AlertaClimaService {
  constructor(
    @InjectRepository(AlertaClima)
    private readonly alertaRepo: Repository<AlertaClima>,
    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,
  ) {}

  async crear(personaId: string, dto: CreateAlertaClimaDto) {
    const persona = await this.personaRepo.findOne({ where: { id: personaId } });
    if (!persona) throw new NotFoundException('Persona no encontrada');

    // Una sola alerta activa por persona (idempotente): si ya hay, se reusa.
    const existente = await this.alertaRepo.findOne({
      where: { persona: { id: personaId }, estado: 'activa' } as any,
      order: { fechaCreacion: 'ASC' },
    });

    const datos = {
      email: persona.email ?? '',
      horaViaje: this.normalizarHora(dto.horaViaje),
      ciudad: dto.ciudad?.trim() || process.env.DEFAULT_CITY || 'Bogota',
      canal: dto.canal,
      telegramChatId: dto.canal === 'telegram' ? (dto.telegramChatId ?? null) : null,
      estado: 'activa' as const,
    };

    if (existente) {
      Object.assign(existente, datos);
      existente.ultimaNotificacion = null; // reinicia anti-dup ante un cambio de prefs
      return await this.alertaRepo.save(existente);
    }

    const alerta = this.alertaRepo.create({
      persona: { id: personaId } as any,
      ...datos,
      ultimaNotificacion: null,
    });
    return await this.alertaRepo.save(alerta);
  }

  async actualizar(id: string, dto: UpdateAlertaClimaDto) {
    const alerta = await this.alertaRepo.findOne({ where: { id } });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');
    if (dto.horaViaje !== undefined) alerta.horaViaje = this.normalizarHora(dto.horaViaje);
    if (dto.ciudad !== undefined) alerta.ciudad = dto.ciudad;
    if (dto.canal !== undefined) {
      alerta.canal = dto.canal;
      if (dto.canal === 'email') alerta.telegramChatId = null;
    }
    if (dto.telegramChatId !== undefined) alerta.telegramChatId = dto.telegramChatId;
    return await this.alertaRepo.save(alerta);
  }

  async listarPorPersona(personaId: string) {
    return await this.alertaRepo.find({
      where: { persona: { id: personaId } },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async desactivar(id: string) {
    const alerta = await this.alertaRepo.findOne({ where: { id } });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');
    alerta.estado = 'inactiva';
    return await this.alertaRepo.save(alerta);
  }

  /**
   * Suscripciones a notificar AHORA: activas, cuyo horario de viaje cae en la ventana
   * [ahora, ahora + 2h] y que no hayan sido notificadas hoy. Trae el set de activas y
   * filtra en memoria (dataset pequeño y la comparación es por hora-del-día).
   */
  async findPendientes(ahora: Date = new Date()): Promise<AlertaClima[]> {
    const activas = await this.alertaRepo.find({ where: { estado: 'activa' } });
    return activas.filter(
      (a) =>
        this.enVentana(a.horaViaje, ahora) &&
        !this.notificadaHoy(a.ultimaNotificacion, ahora),
    );
  }

  async marcarNotificada(id: string, cuando: Date = new Date()) {
    await this.alertaRepo.update({ id }, { ultimaNotificacion: cuando });
  }

  // ---- Helpers puros (testeables sin DB) ----

  /** true si `ahora` está dentro de las 2 h previas a `horaViaje` (mismo día). */
  enVentana(horaViaje: string | undefined, ahora: Date): boolean {
    if (!horaViaje) return false;
    const minutosViaje = this.minutosDelDia(horaViaje);
    if (minutosViaje === null) return false;
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const inicioVentana = minutosViaje - VENTANA_HORAS * 60;
    return minutosAhora >= inicioVentana && minutosAhora <= minutosViaje;
  }

  /** true si la última notificación fue el mismo día calendario que `ahora`. */
  notificadaHoy(ultima: Date | null | undefined, ahora: Date): boolean {
    if (!ultima) return false;
    const u = new Date(ultima);
    return (
      u.getFullYear() === ahora.getFullYear() &&
      u.getMonth() === ahora.getMonth() &&
      u.getDate() === ahora.getDate()
    );
  }

  /** Construye el texto según el pronóstico (función pura, usada por el grafo). */
  construirMensaje(p: ClimaPronostico): MensajeClima {
    const lluvia = p.probLluvia > UMBRAL_LLUVIA;
    if (lluvia) {
      return {
        lluvia: true,
        pronostico: `🌧️ Hoy lloverá (${p.probLluvia}% probabilidad). Temperatura: ${p.temp}°C en ${p.ciudad}.`,
        recomendacion:
          'Te recomendamos salir 10-15 minutos antes por posibles retrasos en el tráfico. ¡No olvides tu paraguas!',
      };
    }
    return {
      lluvia: false,
      pronostico: `☀️ Clima favorable hoy en ${p.ciudad}. Temperatura: ${p.temp}°C.`,
      recomendacion: '¡Buen viaje!',
    };
  }

  private normalizarHora(hora: string): string {
    const [hh = '00', mm = '00', ss = '00'] = hora.split(':');
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}`;
  }

  private minutosDelDia(hora: string): number | null {
    const [hh, mm] = hora.split(':');
    const h = Number(hh);
    const m = Number(mm);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }
}
