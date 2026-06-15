import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UbicacionBus } from './entities/ubicacion-bus.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Ruta } from '../ruta/entities/ruta.entity';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity';
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
    @InjectRepository(IncidenteBus)
    private incidenteRepo: Repository<IncidenteBus>,    
    private httpService: HttpService,
    private readonly monitoreoGateway: MonitoreoGateway,
  ) {}

  async actualizarUbicacion(busId: number, latitude: number, longitude: number, velocidad: number) {
    const bus = await this.busRepo.findOne({
      where: { id: busId },
      relations: ['gps'],
    });
    if (!bus) throw new NotFoundException('Bus no encontrado');

    // 1. Buscamos la programación que está actualmente en curso para este bus
    const programacionActiva = await this.programacionRepo.findOne({
      where: { bus: { id: busId }, estado: EstadoProgramacion.EN_CURSO } as any,
      order: { fechaCreacion: 'DESC' } as any,
    });

    // 2. Filtro Seguro: Buscamos si hay un incidente real reportado en las tablas para este viaje actual
    let incidenteReal : IncidenteBus | null = null;
    if (programacionActiva) {
      incidenteReal = await this.incidenteRepo.findOne({
        where: {
          bus: { id: busId },
          programacion: { id: programacionActiva.id } as any // Solo incidentes vinculados a este viaje activo
        }
      });
    }

    // 3. Evaluamos también el retraso cronológico por tiempo
    const retraso = await this.verificarRetraso(busId);

    // 4. Determinación final del estado cruzando ambas tablas:
    const estado = (incidenteReal || retraso.estaRetrasado) ? 'incidente' : 'normal';

    const ubicacion = this.ubicacionRepo.create({
      bus,
      latitude,
      longitude,
      velocidad,
      estado, 
    } as any);
    await this.ubicacionRepo.save(ubicacion);

    this.monitoreoGateway.emitirActualizacionBus({
      busId,
      placa: bus.placa,
      latitud: latitude,
      longitud: longitude,
      velocidad,
      estado,
      timestamp: new Date()
    });

    if (bus.gps) {
      bus.gps.latitude = latitude;
      bus.gps.longitude = longitude;
      bus.gps.lastUpdate = new Date();
    }

    if (retraso.estaRetrasado) {
      await this.enviarAlertaRetraso(bus.placa ?? '', retraso.minutosRetraso);
    }

    return { success: true, estado };
  }

  // --- MÉTODOS REQUERIDOS POR EL CONTROLADOR ---
  async getBusesActivosPorRuta(rutaId: number) {
    return await this.ubicacionRepo.find({
      where: { ruta: { id: rutaId as any } },
      relations: ['bus'],
      order: { timestamp: 'DESC' } as any,
      take: 20
    });
  }

  /**
   * 🗺️ HU-3-002: Calcula el tiempo estimado (ETA) real usando geolocalización matemática
   */
  async getEtaParaParadero(busId: number, paraderoId: number) {
    // 1. Buscamos el bus trayendo su relación de GPS activa para conocer su latitud y longitud actuales
    const bus = await this.busRepo.findOne({ 
      where: { id: busId },
      relations: ['gps']
    });
    
    // 2. Buscamos el paradero seleccionado por el ciudadano
    const paradero = await this.paraderoRepo.findOne({ where: { id: paraderoId } });
    
    if (!bus || !paradero) throw new NotFoundException('Bus o Paradero no encontrado');
    
    // Si el bus no tiene coordenadas válidas en su sensor GPS, retornamos un estimado base seguro
    if (!bus.gps || bus.gps.latitude === undefined || bus.gps.longitude === undefined) {
      return { busId, paraderoId, etaMinutos: 10, nota: 'Coordenadas del bus no disponibles en este momento' };
    }

    // Adaptabilidad flexible de nombres de campos para la base de datos (latitud/latitude)
    const paraderoLat = (paradero as any).latitud ?? (paradero as any).latitude ?? 0;
    const paraderoLon = (paradero as any).longitud ?? (paradero as any).longitude ?? 0;

    // 3. Calculamos la distancia geométrica real en kilómetros usando la fórmula esférica
    const distanciaKm = this.calcularDistanciaHaversine(
      Number(bus.gps.latitude),
      Number(bus.gps.longitude),
      Number(paraderoLat),
      Number(paraderoLon)
    );

    // 4. Determinamos la velocidad de cálculo (evita divisiones por cero si el bus frena en un semáforo)
    const velocidadGps = (bus.gps as any).velocidad ? Number((bus.gps as any).velocidad) : 0;
    const velocidadCalculo = velocidadGps > 5 ? velocidadGps : 25; // 25 km/h es la media de tráfico urbano seguro

    // 5. Tiempo = Distancia / Velocidad (Multiplicado por 60 para convertir las horas en minutos)
    const tiempoHoras = distanciaKm / velocidadCalculo;
    let etaMinutos = Math.round(tiempoHoras * 60);

    // 6. Añadimos un margen estándar de +2 minutos para amortiguar semáforos y subida de pasajeros
    etaMinutos += 2;

    return { 
      busId, 
      paraderoId, 
      etaMinutos: Math.max(1, etaMinutos), // Asegura que nunca devuelva 0 o tiempos negativos
      distanciaMetros: Math.round(distanciaKm * 1000)
    }; 
  }

  /**
   * 📐 Fórmula matemática de Haversine para cálculo de distancias sobre la superficie terrestre
   */
  private calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radioTierraKm = 6371; // Radio promedio del planeta Tierra
    
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radioTierraKm * c; // Retorna los kilómetros exactos de separación
  }
  // ---------------------------------------------

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
      return { estaRetrasado: minutosRetraso > UMBRAL_MINUTOS, minutosRetraso: Math.max(0, minutosRetraso) };
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