import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Programacion, EstadoProgramacion } from '../programacion/entities/programacion.entity';
import { MonitoreoService } from './monitoreo.service';

/**
 * 🛰️ HU-3-002: GPS simulado (feature-flag `GPS_SIMULADO` en .env).
 *
 * Con el flag en `true`, el server mueve solo los buses EN_CURSO: cada N ms
 * genera una posición nueva y la mete por el MISMO pipeline que el GPS real
 * (`MonitoreoService.actualizarUbicacion` → guarda ubicación + emite socket
 * `actualizacionFlotaGlobal` + calcula estado). Con el flag apagado no hace nada
 * y manda el GPS real (los POST de dispositivos). No corre script aparte.
 */
@Injectable()
export class GpsSimuladorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('GpsSimulador');
  private timer?: NodeJS.Timeout;
  // Posición + dirección de deriva por bus (en memoria).
  private posiciones = new Map<number, { lat: number; lon: number; dLat: number; dLon: number }>();

  constructor(
    @InjectRepository(Programacion)
    private programacionRepo: Repository<Programacion>,
    private readonly monitoreoService: MonitoreoService,
  ) {}

  onModuleInit() {
    if (process.env.GPS_SIMULADO !== 'true') return;
    const intervalo = Number(process.env.GPS_SIMULADO_MS ?? 3000);
    this.logger.log(`🛰️  GPS SIMULADO activo (cada ${intervalo}ms): los buses EN_CURSO se mueven solos.`);
    this.timer = setInterval(() => void this.tick(), intervalo);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    try {
      const programaciones = await this.programacionRepo.find({
        where: { estado: EstadoProgramacion.EN_CURSO } as any,
        relations: ['bus', 'bus.gps'],
      });

      const vistos = new Set<number>();
      for (const prog of programaciones) {
        const bus = prog.bus;
        const busId = bus?.id;
        if (!bus || busId == null || vistos.has(busId)) continue;
        vistos.add(busId);

        let pos = this.posiciones.get(busId);
        if (!pos) {
          // Posición inicial = la del GPS sembrado, o centro de Manizales.
          const lat = bus.gps?.latitude != null ? Number(bus.gps.latitude) : 5.06;
          const lon = bus.gps?.longitude != null ? Number(bus.gps.longitude) : -75.51;
          pos = { lat, lon, dLat: (Math.random() - 0.5) * 0.0016, dLon: (Math.random() - 0.5) * 0.0016 };
          this.posiciones.set(busId, pos);
        }

        pos.lat += pos.dLat;
        pos.lon += pos.dLon;
        // Rebote suave para que no se alejen del mapa.
        if (pos.lat > 5.075 || pos.lat < 5.045) pos.dLat *= -1;
        if (pos.lon > -75.49 || pos.lon < -75.525) pos.dLon *= -1;

        const velocidad = 20 + Math.round(Math.random() * 25);
        // alertarRetraso=false: en modo simulado no spameamos back-notis cada tick.
        await this.monitoreoService.actualizarUbicacion(busId, pos.lat, pos.lon, velocidad, false);
      }
    } catch (e) {
      this.logger.error(`tick falló: ${(e as Error).message}`);
    }
  }
}
