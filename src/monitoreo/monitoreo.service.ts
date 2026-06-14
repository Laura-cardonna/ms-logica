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
import { MonitoreoGateway } from './monitore.gateway';

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
    private readonly monitoreoGateway: MonitoreoGateway, // 👈 GATEWAY INYECTADO
  ) {}

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

    // ✨ EMISIÓN AL WEBSOCKET PARA TIEMPO REAL
    this.monitoreoGateway.emitirActualizacionBus({
      busId,
      placa: bus.placa,
      latitud: latitude,
      longitud: longitude,
      velocidad,
      timestamp: new Date()
    });

    // Actualiza el dispositivo GPS del bus
    if (bus.gps) {
      bus.gps.latitude = latitude;
      bus.gps.longitude = longitude;
      bus.gps.lastUpdate = new Date();
      // Opcional: podrías guardar el GPS aquí si fuera necesario
    }

    const retraso = await this.verificarRetraso(busId);
    if (retraso.estaRetrasado) {
      await this.enviarAlertaRetraso(bus.placa ?? '', retraso.minutosRetraso);
    }

    return { success: true };
  }

  // ... (Tus métodos getBusesActivosPorRuta, getEtaParaParadero, etc. permanecen igual)

  private async verificarRetraso(busId: number) {
    const UMBRAL_MINUTOS = 10;
    try {
      const ahora = new Date();
      const programacion = await this.programacionRepo.findOne({
        where: { bus: { id: busId }, estado: EstadoProgramacion.EN_CURSO } as any,
        order: { fechaCreacion: 'DESC' } as any,
      });

      if (!programacion) return { estaRetrasado: false, minutosRetraso: 0 };

      const fechaStr = programacion.fecha ? new Date(programacion.fecha).toISOString().split('T')[0] : ahora.toISOString().split('T')[0];
      const salidaEsperada = new Date(`${fechaStr}T${programacion.horaSalida ?? '00:00'}:00`);
      const minutosDesdePartida = Math.round((ahora.getTime() - salidaEsperada.getTime()) / 60000);
      const minutosRetraso = minutosDesdePartida - (programacion.margenToleranciaMinutos ?? 0);

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
      await firstValueFrom(this.httpService.post(`${url}/api/enviar-alerta-retraso`, { placa, minutosRetraso }));
    } catch (e) {
      console.error('Error enviando alerta:', (e as Error).message);
    }
  }
}