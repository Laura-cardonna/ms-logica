import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UbicacionBus } from './entities/ubicacion-bus.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Ruta } from '../ruta/entities/ruta.entity';
import { Paradero } from '../paradero/entities/paradero.entity';
import { Programacion, EstadoProgramacion } from '../programacion/entities/programacion.entity';

@Injectable()
export class MonitoreoService {
  constructor(
    @InjectRepository(UbicacionBus)
    private ubicacionRepo: Repository<UbicacionBus>,
    @InjectRepository(Bus)
    private busRepo: Repository<Bus>,
    @InjectRepository(Ruta)
    private rutaRepo: Repository<Ruta>,
    @InjectRepository(Paradero)
    private paraderoRepo: Repository<Paradero>,
    @InjectRepository(Programacion)
    private programacionRepo: Repository<Programacion>,
    private httpService: HttpService,
  ) {}

  // ── Llamado por el GPS del bus ──────────────────────────────────────────────
  async actualizarUbicacion(
    busId: number,
    latitude: number,
    longitude: number,
    velocidad: number,
  ) {
    const bus = await this.busRepo.findOne({
      where: { id: busId },
      relations: ['gps'],
    });
    if (!bus) throw new NotFoundException('Bus no encontrado');

    const ubicacion = this.ubicacionRepo.create({
      bus,
      latitude,
      longitude,
      velocidad,
    });
    await this.ubicacionRepo.save(ubicacion);

    // Actualiza el dispositivo GPS del bus
    if (bus.gps) {
      bus.gps.latitude = latitude;
      bus.gps.longitude = longitude;
      bus.gps.lastUpdate = new Date();
    }

    const retraso = await this.verificarRetraso(busId);
    if (retraso.estaRetrasado) {
      await this.enviarAlertaRetraso(bus.placa ?? '', retraso.minutosRetraso);
    }

    return { success: true };
  }

  // ── Llamado por el frontend cada 10 segundos ────────────────────────────────
  async getBusesActivosPorRuta(rutaId: number) {
    const ruta = await this.rutaRepo.findOne({ where: { id: rutaId } });
    if (!ruta) throw new NotFoundException('Ruta no encontrada');

    const diezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);

    // ✅ FIX: usa join por relación, no por columna directa
    const ubicaciones = await this.ubicacionRepo
      .createQueryBuilder('ub')
      .innerJoinAndSelect('ub.bus', 'bus')
      .innerJoin('ub.ruta', 'ruta')
      .where('ruta.id = :rutaId', { rutaId })
      .andWhere('ub.timestamp >= :desde', { desde: diezMinutosAtras })
      .orderBy('ub.timestamp', 'DESC')
      .getMany();

    // Solo la más reciente por bus
    const mapaUltimas = new Map<number, typeof ubicaciones[0]>();
    for (const ub of ubicaciones) {
      const idBus = ub.bus?.id;
      if (idBus !== undefined && !mapaUltimas.has(idBus)) {
        mapaUltimas.set(idBus, ub);
      }
    }

    // Paraderos de la ruta via relación rutaParaderos
    const paraderos = await this.paraderoRepo
      .createQueryBuilder('p')
      .innerJoin('p.rutaParaderos', 'rp')
      .innerJoin('rp.ruta', 'r')
      .where('r.id = :rutaId', { rutaId })
      .getMany();

    const resultado = await Promise.all(
      Array.from(mapaUltimas.values()).map(async (ub) => {
        const paraderoInfo = this.getParaderoMasCercano(
          ub.latitude,
          ub.longitude,
          paraderos,
        );
        const retraso = await this.verificarRetraso(ub.bus?.id ?? 0);

        return {
          busId: ub.bus?.id,
          placa: ub.bus?.placa ?? '',
          latitude: Number(ub.latitude),
          longitude: Number(ub.longitude),
          velocidad: Number(ub.velocidad),
          ultimaActualizacion: ub.timestamp,
          paraderoMasCercano: paraderoInfo,
          tiempoEstimadoLlegada: this.calcularETA(Number(ub.velocidad)),
          estaRetrasado: retraso.estaRetrasado,
          minutosRetraso: retraso.minutosRetraso,
        };
      }),
    );

    return resultado;
  }

  // ── ETA hacia un paradero específico del ciudadano ──────────────────────────
  async getEtaParaParadero(busId: number, paraderoId: number) {
    const ultimaUbicacion = await this.ubicacionRepo.findOne({
      where: { bus: { id: busId } },
      order: { timestamp: 'DESC' },
    });
    if (!ultimaUbicacion) throw new NotFoundException('Bus sin ubicación registrada');

    const paradero = await this.paraderoRepo.findOne({
      where: { id: paraderoId },
    });
    if (!paradero) throw new NotFoundException('Paradero no encontrado');

    const distancia = this.calcularDistanciaKm(
      Number(ultimaUbicacion.latitude),
      Number(ultimaUbicacion.longitude),
      Number(paradero.latitud),
      Number(paradero.longitud),
    );

    const velocidadPromedio = Number(ultimaUbicacion.velocidad) || 30;
    const eta = Math.round((distancia / velocidadPromedio) * 60);

    return { eta, distanciaKm: Number(distancia.toFixed(2)) };
  }

  // ── Helpers privados ─────────────────────────────────────────────────────────

  private calcularDistanciaKm(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad = (v: number) => (v * Math.PI) / 180;

  private getParaderoMasCercano(
    latBus: number,
    lonBus: number,
    paraderos: Paradero[],
  ) {
    if (!paraderos.length) {
      return { id: null, nombre: 'Sin paraderos', distanciaMetros: 0 };
    }

    let cercano = paraderos[0];
    let minDist = Infinity;

    for (const p of paraderos) {
      const dist = this.calcularDistanciaKm(
        latBus, lonBus,
        Number(p.latitud),
        Number(p.longitud),
      );
      if (dist < minDist) {
        minDist = dist;
        cercano = p;
      }
    }

    return {
      id: cercano.id,
      nombre: cercano.nombre ?? 'Paradero',
      distanciaMetros: Math.round(minDist * 1000),
    };
  }

  private calcularETA(velocidad: number): number {
    return Math.round(300 / (velocidad || 30));
  }

  // ✅ IMPLEMENTADO: usa fecha + horaSalida + margenToleranciaMinutos reales
  private async verificarRetraso(busId: number) {
    const UMBRAL_MINUTOS = 10;

    try {
      const ahora = new Date();
      const fechaHoy = ahora.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      const horaActual = ahora.toTimeString().slice(0, 5); // 'HH:MM'

      // Busca la programación EN CURSO del bus para hoy
      const programacion = await this.programacionRepo.findOne({
        where: {
          bus: { id: busId },
          estado: EstadoProgramacion.EN_CURSO,
        } as any,
        order: { fechaCreacion: 'DESC' } as any,
      });

      if (!programacion) {
        return { estaRetrasado: false, minutosRetraso: 0 };
      }

      // Construye la hora de salida esperada como Date completo
      const fechaStr = programacion.fecha
        ? new Date(programacion.fecha).toISOString().split('T')[0]
        : fechaHoy;
      const horaSalidaStr = programacion.horaSalida ?? '00:00';
      const salidaEsperada = new Date(`${fechaStr}T${horaSalidaStr}:00`);

      // Minutos transcurridos desde que debió salir
      const minutosDesdePartida = Math.round(
        (ahora.getTime() - salidaEsperada.getTime()) / 60000,
      );

      // El margen de tolerancia absorbe pequeños retrasos normales
      const margen = programacion.margenToleranciaMinutos ?? 0;
      const minutosRetraso = minutosDesdePartida - margen;

      return {
        estaRetrasado: minutosRetraso > UMBRAL_MINUTOS,
        minutosRetraso: Math.max(0, minutosRetraso),
      };

    } catch {
      return { estaRetrasado: false, minutosRetraso: 0 };
    }
  }

  private async enviarAlertaRetraso(placa: string, minutosRetraso: number) {
    const url = process.env.MS_NOTIFICACIONES_URL;
    if (!url) return;

    try {
      await firstValueFrom(
        this.httpService.post(`${url}/api/enviar-alerta-retraso`, {
          placa,
          minutosRetraso,
        }),
      );
    } catch (e) {
      console.error('Error enviando alerta:', (e as Error).message);
    }
  }
}