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
import { Boleto } from '../boleto/entities/boleto.entity';
import { Incidente } from '../incidente/entities/incidente.entity';
import { NotificacionSuscripcion } from '../notificacion-suscripcion/entities/notificacion-suscripcion.entity';
import { NotificacionService } from '../notificacion/notificacion.service';
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
    @InjectRepository(Boleto)
    private boletoRepo: Repository<Boleto>,
    @InjectRepository(Incidente)
    private incidentePadreRepo: Repository<Incidente>,
    @InjectRepository(NotificacionSuscripcion)
    private suscripcionRepo: Repository<NotificacionSuscripcion>,
    private httpService: HttpService,
    private readonly notificacionService: NotificacionService,
    private readonly monitoreoGateway: MonitoreoGateway,
  ) {}

  async actualizarUbicacion(busId: number, latitude: number, longitude: number, velocidad: number, alertarRetraso = true) {
    const bus = await this.busRepo.findOne({
      where: { id: busId },
      relations: ['gps'],
    });
    if (!bus) throw new NotFoundException('Bus no encontrado');

    // 1. Buscamos la programación que está actualmente en curso para este bus
    //    (con la ruta, para filtrar las suscripciones de proximidad por ruta).
    const programacionActiva = await this.programacionRepo.findOne({
      where: { bus: { id: busId }, estado: EstadoProgramacion.EN_CURSO } as any,
      relations: ['ruta'],
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

    // HU-3-002: enriquecer el payload del socket para que el mapa del supervisor
    // pueda pintar el marcador naranja de ocupación máxima en tiempo real.
    const pasajerosCalculados = programacionActiva?.id != null
      ? await this.contarBoletosActivos(programacionActiva.id)
      : 0;

    this.monitoreoGateway.emitirActualizacionBus({
      busId,
      placa: bus.placa,
      latitud: latitude,
      longitud: longitude,
      velocidad,
      estado,
      pasajerosCalculados,
      capacidadMaxima: bus.capacidadMaxima ?? null,
      timestamp: new Date()
    });

    if (bus.gps) {
      bus.gps.latitude = latitude;
      bus.gps.longitude = longitude;
      bus.gps.lastUpdate = new Date();
    }

    if (retraso.estaRetrasado && alertarRetraso) {
      await this.enviarAlertaRetraso(bus.placa ?? '', retraso.minutosRetraso);
    }

    // HU-ENTR-3-003: tras guardar la posición, avisamos a los ciudadanos suscritos
    // de esta ruta cuyo paradero ya está dentro de su ventana de anticipación.
    if (programacionActiva?.ruta?.id != null) {
      await this.notificarBusProximo(bus, programacionActiva.ruta.id);
    }

    return { success: true, estado };
  }

  /**
   * 🔔 HU-ENTR-3-003: Job de proximidad. Se dispara en cada POST de GPS.
   * Filtra las suscripciones ACTIVAS de la ruta del bus (no recorre todas) y,
   * por cada una, reusa getEtaParaParadero para decidir el disparo. Anti-spam
   * con notificadaEn: notifica una vez por acercamiento y se resetea al alejarse.
   */
  private async notificarBusProximo(bus: Bus, rutaId: number) {
    const suscripciones = await this.suscripcionRepo.find({
      where: { ruta: { id: rutaId }, estado: 'activa' } as any,
      relations: ['persona', 'paradero', 'ruta'],
    });
    if (!suscripciones.length) return;

    // Anti-spam por cooldown: a lo sumo 1 alerta cada COOLDOWN_MIN por suscripción.
    // Evita el bucle de re-notificación cuando la ETA simulada oscila alrededor del
    // umbral (el simulador rebota el bus). Configurable por env.
    const COOLDOWN_MIN = Number(process.env.NOTIF_PROXIMIDAD_COOLDOWN_MIN ?? 10);

    for (const sub of suscripciones) {
      const personaId = sub.persona?.id;
      const paraderoId = sub.paradero?.id;
      const umbral = sub.minutosAnticipacion;
      if (personaId == null || paraderoId == null || umbral == null) continue;

      let etaMinutos: number;
      try {
        ({ etaMinutos } = await this.getEtaParaParadero(bus.id as number, paraderoId));
      } catch {
        continue; // sin ubicación reciente del bus aún; lo reintenta el próximo tick
      }

      const dentroDeVentana = etaMinutos <= umbral;
      if (!dentroDeVentana) continue;

      const minutosDesdeUltima = sub.notificadaEn
        ? (Date.now() - new Date(sub.notificadaEn).getTime()) / 60000
        : Infinity;
      if (minutosDesdeUltima < COOLDOWN_MIN) continue; // aún en cooldown → no reenvía

      const rutaNombre = sub.ruta?.nombre ?? '';
      const paraderoNombre = sub.paradero?.nombre ?? '';
      const placa = bus.placa ?? '';

      await this.notificacionService.crearNotificacion(
        sub.persona as any,
        'Tu bus está cerca',
        `El bus ${placa} de la ruta ${rutaNombre} llega a ${paraderoNombre} en ~${etaMinutos} min.`,
      );

      this.monitoreoGateway.emitirAlertaBusProximo(personaId, {
        rutaNombre,
        etaMinutos,
        placa,
        busId: bus.id,
        paraderoNombre,
      });

      sub.notificadaEn = new Date();
      await this.suscripcionRepo.save(sub);
    }
  }

  // --- MÉTODOS REQUERIDOS POR EL CONTROLADOR ---
  /**
   * 🚍 HU-3-001: Buses activos de una ruta enriquecidos.
   * "Bus activo" = Programacion EN_CURSO. Parte de la programación, no del bus suelto,
   * y toma la ÚLTIMA posición por bus (no las últimas 20 filas globales).
   */
  async getBusesActivosPorRuta(rutaId: number) {
    const programaciones = await this.programacionRepo.find({
      where: { ruta: { id: rutaId }, estado: EstadoProgramacion.EN_CURSO } as any,
      relations: ['bus', 'bus.gps', 'ruta', 'ruta.rutaParaderos', 'ruta.rutaParaderos.paradero'],
      order: { fechaCreacion: 'DESC' } as any,
    });

    const resultado: any[] = [];
    const vistos = new Set<number>();

    for (const prog of programaciones) {
      const bus = prog.bus;
      const busId = bus?.id;
      if (!bus || busId == null || vistos.has(busId)) continue; // dedupe por bus
      vistos.add(busId);

      const ultima = await this.ultimaUbicacionDeBus(busId);
      const lat = ultima ? Number(ultima.latitude) : (bus.gps?.latitude != null ? Number(bus.gps.latitude) : null);
      const lon = ultima ? Number(ultima.longitude) : (bus.gps?.longitude != null ? Number(bus.gps.longitude) : null);
      if (lat == null || lon == null) continue; // sin posición no se pinta en el mapa

      const paraderoMasCercano = this.paraderoMasCercano(lat, lon, prog.ruta?.rutaParaderos);
      const retraso = this.calcularRetraso(prog);

      // Incidente real vinculado a este viaje (paridad con actualizarUbicacion)
      const incidenteReal = await this.incidenteRepo.findOne({
        where: { bus: { id: busId }, programacion: { id: prog.id } as any } as any,
      });

      let tiempoEstimadoLlegada = 0;
      if (paraderoMasCercano) {
        const eta = await this.getEtaParaParadero(busId, paraderoMasCercano.id);
        tiempoEstimadoLlegada = (eta as any).etaMinutos ?? 0;
      }

      const velocidad = ultima?.velocidad != null
        ? Number(ultima.velocidad)
        : (bus.gps?.velocidad ? Number(bus.gps.velocidad) : 0);

      resultado.push({
        busId,
        placa: bus.placa,
        latitude: lat,
        longitude: lon,
        velocidad,
        ultimaActualizacion: ultima?.timestamp ?? bus.gps?.lastUpdate ?? null,
        paraderoMasCercano,
        tiempoEstimadoLlegada,
        estaRetrasado: retraso.estaRetrasado,
        minutosRetraso: retraso.minutosRetraso,
        estado: (incidenteReal || retraso.estaRetrasado) ? 'incidente' : 'normal',
      });
    }

    return resultado;
  }

  // ============================================================
  // 📊 HU-3-002: Panel de control en tiempo real (supervisor)
  // ============================================================

  /** Cuenta boletos a bordo ('activo') de una programación. */
  private async contarBoletosActivos(programacionId: number): Promise<number> {
    return this.boletoRepo.count({
      where: { estado: 'activo', programacion: { id: programacionId } as any },
    });
  }

  /**
   * 👥 Total de pasajeros en tránsito: boletos 'activo' de todas las
   * programaciones EN_CURSO.
   */
  async getTotalPasajerosEnTransito(): Promise<number> {
    const activas = await this.programacionRepo.find({
      where: { estado: EstadoProgramacion.EN_CURSO } as any,
    });
    let total = 0;
    for (const prog of activas) {
      if (prog.id != null) total += await this.contarBoletosActivos(prog.id);
    }
    return total;
  }

  /**
   * 🟧 Alertas de ocupación: por programación EN_CURSO, compara boletos activos
   * vs bus.capacidadMaxima. Devuelve solo los buses que alcanzan/superan el máximo.
   */
  async getAlertasOcupacion(): Promise<
    { busId: number; placa?: string; pasajeros: number; capacidad: number }[]
  > {
    const activas = await this.programacionRepo.find({
      where: { estado: EstadoProgramacion.EN_CURSO } as any,
      relations: ['bus'],
    });
    const alertas: { busId: number; placa?: string; pasajeros: number; capacidad: number }[] = [];
    for (const prog of activas) {
      const bus = prog.bus;
      const capacidad = Number(bus?.capacidadMaxima ?? 0);
      if (!bus?.id || capacidad <= 0 || prog.id == null) continue;
      const pasajeros = await this.contarBoletosActivos(prog.id);
      if (pasajeros >= capacidad) {
        alertas.push({ busId: bus.id, placa: bus.placa, pasajeros, capacidad });
      }
    }
    return alertas;
  }

  /**
   * 🚨 Incidentes activos no resueltos: incidente_bus ligados a una programación
   * EN_CURSO cuyo Incidente padre no esté 'resuelto' (si no hay padre → 'pendiente').
   */
  async getIncidentesActivos(): Promise<
    {
      id?: number;
      busId?: number;
      placa?: string;
      descripcion?: string;
      gravedad?: string;
      estado: string;
      fecha?: Date;
    }[]
  > {
    const incidentes = await this.incidenteRepo.find({
      where: { programacion: { estado: EstadoProgramacion.EN_CURSO } as any } as any,
      relations: ['bus', 'programacion', 'incidente'],
      order: { timestamp: 'DESC' } as any,
    });

    return incidentes
      .map((inc) => ({
        id: inc.id,
        busId: inc.bus?.id,
        placa: inc.bus?.placa,
        descripcion: inc.descripcion,
        gravedad: inc.gravedad,
        estado: inc.incidente?.estado ?? 'pendiente',
        fecha: inc.timestamp,
      }))
      .filter((inc) => inc.estado !== 'resuelto');
  }

  /**
   * 🗺️ Flota activa global para el mapa del supervisor. Reusa el patrón de
   * getBusesActivosPorRuta pero sobre TODAS las programaciones EN_CURSO.
   * Posición = última ubicaciones_bus o fallback bus.gps (igual que HU-3-001),
   * para que el mapa muestre buses sin depender de un POST de GPS en vivo.
   */
  async getFlotaActivaGlobal() {
    const programaciones = await this.programacionRepo.find({
      where: { estado: EstadoProgramacion.EN_CURSO } as any,
      relations: ['bus', 'bus.gps'],
      order: { fechaCreacion: 'DESC' } as any,
    });

    const buses: any[] = [];
    const vistos = new Set<number>();

    for (const prog of programaciones) {
      const bus = prog.bus;
      const busId = bus?.id;
      if (!bus || busId == null || vistos.has(busId)) continue;
      vistos.add(busId);

      const ultima = await this.ultimaUbicacionDeBus(busId);
      const lat = ultima ? Number(ultima.latitude) : (bus.gps?.latitude != null ? Number(bus.gps.latitude) : null);
      const lon = ultima ? Number(ultima.longitude) : (bus.gps?.longitude != null ? Number(bus.gps.longitude) : null);
      if (lat == null || lon == null) continue; // sin posición no se pinta

      const incidenteReal = await this.incidenteRepo.findOne({
        where: { bus: { id: busId }, programacion: { id: prog.id } as any } as any,
      });
      const retraso = this.calcularRetraso(prog);
      const pasajerosCalculados = prog.id != null ? await this.contarBoletosActivos(prog.id) : 0;
      const velocidad = ultima?.velocidad != null
        ? Number(ultima.velocidad)
        : (bus.gps?.velocidad ? Number(bus.gps.velocidad) : 0);

      buses.push({
        busId,
        placa: bus.placa,
        latitud: lat,
        longitud: lon,
        estado: (incidenteReal || retraso.estaRetrasado) ? 'incidente' : 'normal',
        pasajerosCalculados,
        capacidadMaxima: bus.capacidadMaxima ?? null,
        velocidad,
      });
    }

    return buses;
  }

  /**
   * 🧮 Ensambla el panel de control. `buses` alimenta el mapa desde la BD;
   * el socket actualiza en vivo encima. KPIs por polling (30s).
   */
  async getDashboard() {
    const buses = await this.getFlotaActivaGlobal();
    const pasajerosEnTransito = await this.getTotalPasajerosEnTransito();
    const incidentes = await this.getIncidentesActivos();
    const alertasOcupacion = (await this.getAlertasOcupacion()).length;

    return {
      buses,
      pasajerosEnTransito,
      busesOperando: buses.length,
      totalActivos: buses.length, // alias de compatibilidad con el modelo del front
      incidentes,
      incidentesActivos: incidentes.length,
      alertasOcupacion,
    };
  }

  /** Última posición registrada de un bus (un row por update, ordenado por timestamp DESC). */
  private async ultimaUbicacionDeBus(busId: number) {
    return await this.ubicacionRepo.findOne({
      where: { bus: { id: busId as any } } as any,
      order: { timestamp: 'DESC' } as any,
    });
  }

  /**
   * 🗺️ HU-3-001: Paradero más cercano al bus dentro de su ruta EN_CURSO.
   * Reusa Haversine. Devuelve null si no hay paraderos/coordenadas.
   */
  async getNearestParadero(busId: number) {
    const prog = await this.programacionRepo.findOne({
      where: { bus: { id: busId }, estado: EstadoProgramacion.EN_CURSO } as any,
      relations: ['bus', 'bus.gps', 'ruta', 'ruta.rutaParaderos', 'ruta.rutaParaderos.paradero'],
      order: { fechaCreacion: 'DESC' } as any,
    });
    if (!prog?.bus) return null;

    const ultima = await this.ultimaUbicacionDeBus(busId);
    const lat = ultima ? Number(ultima.latitude) : (prog.bus.gps?.latitude != null ? Number(prog.bus.gps.latitude) : null);
    const lon = ultima ? Number(ultima.longitude) : (prog.bus.gps?.longitude != null ? Number(prog.bus.gps.longitude) : null);
    if (lat == null || lon == null) return null;

    return this.paraderoMasCercano(lat, lon, prog.ruta?.rutaParaderos);
  }

  /** Helper puro: paradero de menor distancia entre los rutaParaderos dados. */
  private paraderoMasCercano(lat: number, lon: number, rutaParaderos?: any[]) {
    if (!rutaParaderos?.length) return null;
    let mejor: { id: number; nombre: string; distanciaMetros: number } | null = null;
    let mejorKm = Infinity;
    for (const rp of rutaParaderos) {
      const p = rp?.paradero;
      if (!p || p.latitud == null || p.longitud == null) continue;
      const km = this.calcularDistanciaHaversine(lat, lon, Number(p.latitud), Number(p.longitud));
      if (km < mejorKm) {
        mejorKm = km;
        mejor = { id: p.id, nombre: p.nombre, distanciaMetros: Math.round(km * 1000) };
      }
    }
    return mejor;
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

    // Posición REAL del bus: misma fuente que el mapa (última ubicaciones_bus),
    // con fallback al GPS sembrado. Si usáramos bus.gps directo, el simulador
    // (que solo persiste en ubicaciones_bus) daría una ETA congelada en la semilla.
    const ultima = await this.ultimaUbicacionDeBus(busId);
    const busLat = ultima?.latitude != null
      ? Number(ultima.latitude)
      : (bus.gps?.latitude != null ? Number(bus.gps.latitude) : null);
    const busLon = ultima?.longitude != null
      ? Number(ultima.longitude)
      : (bus.gps?.longitude != null ? Number(bus.gps.longitude) : null);

    // Sin coordenadas válidas → estimado base seguro
    if (busLat == null || busLon == null) {
      return { busId, paraderoId, etaMinutos: 10, nota: 'Coordenadas del bus no disponibles en este momento' };
    }

    // Adaptabilidad flexible de nombres de campos para la base de datos (latitud/latitude)
    const paraderoLat = (paradero as any).latitud ?? (paradero as any).latitude ?? 0;
    const paraderoLon = (paradero as any).longitud ?? (paradero as any).longitude ?? 0;

    // 3. Calculamos la distancia geométrica real en kilómetros usando la fórmula esférica
    const distanciaKm = this.calcularDistanciaHaversine(
      busLat,
      busLon,
      Number(paraderoLat),
      Number(paraderoLon)
    );

    // 4. Determinamos la velocidad de cálculo (evita divisiones por cero si el bus frena en un semáforo)
    const velocidadGps = ultima?.velocidad != null
      ? Number(ultima.velocidad)
      : ((bus.gps as any)?.velocidad ? Number((bus.gps as any).velocidad) : 0);
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
    try {
      const programacion = await this.programacionRepo.findOne({
        where: { bus: { id: busId }, estado: EstadoProgramacion.EN_CURSO } as any,
        order: { fechaCreacion: 'DESC' } as any,
      });
      return this.calcularRetraso(programacion);
    } catch {
      return { estaRetrasado: false, minutosRetraso: 0 };
    }
  }

  /**
   * ⏱️ Helper puro: retraso de una programación.
   * Umbral 10 min sobre horaSalida + margenToleranciaMinutos. Sin programación → false.
   */
  private calcularRetraso(programacion?: Programacion | null) {
    const UMBRAL_MINUTOS = 10;
    if (!programacion) return { estaRetrasado: false, minutosRetraso: 0 };
    const ahora = new Date();
    const fechaStr = programacion.fecha ? new Date(programacion.fecha).toISOString().split('T')[0] : ahora.toISOString().split('T')[0];
    // La columna es `time` → la DB devuelve "HH:MM:SS"; el seed/cliente puede dar "HH:MM".
    // Normalizamos a HH:MM:SS para no construir un Date inválido (NaN).
    const [hh = '00', mm = '00', ss = '00'] = (programacion.horaSalida ?? '00:00:00').split(':');
    const horaSalida = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}`;
    const salidaEsperada = new Date(`${fechaStr}T${horaSalida}`);
    const minutosDesdePartida = Math.round((ahora.getTime() - salidaEsperada.getTime()) / 60000);
    const minutosRetraso = minutosDesdePartida - (programacion.margenToleranciaMinutos ?? 0);
    return { estaRetrasado: minutosRetraso > UMBRAL_MINUTOS, minutosRetraso: Math.max(0, minutosRetraso) };
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