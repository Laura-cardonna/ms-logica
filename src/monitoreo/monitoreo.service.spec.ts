import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { MonitoreoService } from './monitoreo.service';
import { MonitoreoGateway } from './monitore.gateway';
import { UbicacionBus } from './entities/ubicacion-bus.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Ruta } from '../ruta/entities/ruta.entity';
import { Paradero } from '../paradero/entities/paradero.entity';
import { Programacion, EstadoProgramacion } from '../programacion/entities/programacion.entity';
import { IncidenteBus } from '../incidente_bus/entities/incidente_bus.entity';
import { Boleto } from '../boleto/entities/boleto.entity';
import { Incidente } from '../incidente/entities/incidente.entity';

const repoMock = () => ({ find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), count: jest.fn() });

describe('MonitoreoService', () => {
  let service: MonitoreoService;
  let busRepo: any;
  let paraderoRepo: any;
  let programacionRepo: any;
  let ubicacionRepo: any;
  let boletoRepo: any;
  let incidenteBusRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoreoService,
        { provide: getRepositoryToken(UbicacionBus), useFactory: repoMock },
        { provide: getRepositoryToken(Bus), useFactory: repoMock },
        { provide: getRepositoryToken(Ruta), useFactory: repoMock },
        { provide: getRepositoryToken(Paradero), useFactory: repoMock },
        { provide: getRepositoryToken(Programacion), useFactory: repoMock },
        { provide: getRepositoryToken(IncidenteBus), useFactory: repoMock },
        { provide: getRepositoryToken(Boleto), useFactory: repoMock },
        { provide: getRepositoryToken(Incidente), useFactory: repoMock },
        { provide: HttpService, useValue: { post: jest.fn() } },
        { provide: MonitoreoGateway, useValue: { emitirActualizacionBus: jest.fn() } },
      ],
    }).compile();

    service = module.get(MonitoreoService);
    busRepo = module.get(getRepositoryToken(Bus));
    paraderoRepo = module.get(getRepositoryToken(Paradero));
    programacionRepo = module.get(getRepositoryToken(Programacion));
    ubicacionRepo = module.get(getRepositoryToken(UbicacionBus));
    boletoRepo = module.get(getRepositoryToken(Boleto));
    incidenteBusRepo = module.get(getRepositoryToken(IncidenteBus));
  });

  describe('Haversine', () => {
    it('distancia entre dos coords conocidas ≈ esperado (±1%)', () => {
      // Bogotá Plaza Bolívar → aeropuerto El Dorado ≈ 13.95 km (Haversine)
      const km = (service as any).calcularDistanciaHaversine(4.5981, -74.0758, 4.7016, -74.1469);
      expect(km).toBeGreaterThan(13.81);
      expect(km).toBeLessThan(14.09);
    });
  });

  describe('getNearestParadero', () => {
    it('devuelve el paradero de menor distancia entre varios', async () => {
      programacionRepo.findOne.mockResolvedValue({
        bus: { id: 1, gps: { latitude: 4.6010, longitude: -74.0700 } },
        ruta: {
          rutaParaderos: [
            { paradero: { id: 10, nombre: 'Lejos', latitud: 4.7016, longitud: -74.1469 } },
            { paradero: { id: 11, nombre: 'Cerca', latitud: 4.6012, longitud: -74.0702 } },
            { paradero: { id: 12, nombre: 'Medio', latitud: 4.6300, longitud: -74.0900 } },
          ],
        },
      });
      ubicacionRepo.findOne.mockResolvedValue(null); // usa coords del gps

      const res = await service.getNearestParadero(1);
      expect(res).not.toBeNull();
      expect(res!.id).toBe(11);
      expect(res!.distanciaMetros).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getEtaParaParadero', () => {
    it('velocidad 0 → usa fallback, no NaN ni negativo', async () => {
      busRepo.findOne.mockResolvedValue({ id: 1, gps: { latitude: 4.6010, longitude: -74.0700, velocidad: '0' } });
      paraderoRepo.findOne.mockResolvedValue({ id: 11, latitud: 4.6300, longitud: -74.0900 });

      const res: any = await service.getEtaParaParadero(1, 11);
      expect(Number.isNaN(res.etaMinutos)).toBe(false);
      expect(res.etaMinutos).toBeGreaterThan(0);
    });

    it('GPS ausente → estimado base seguro (no NaN)', async () => {
      busRepo.findOne.mockResolvedValue({ id: 1, gps: null });
      paraderoRepo.findOne.mockResolvedValue({ id: 11, latitud: 4.6300, longitud: -74.0900 });

      const res: any = await service.getEtaParaParadero(1, 11);
      expect(Number.isNaN(res.etaMinutos)).toBe(false);
      expect(res.etaMinutos).toBeGreaterThan(0);
    });
  });

  describe('calcularRetraso', () => {
    // fecha y hora SIEMPRE en hora local y consistentes (la impl parsea `${fecha}T${hora}`
    // como hora local). Construir ambas desde la misma Date evita desfases UTC↔local.
    const localDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const localHM = (d: Date) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const progHaceMin = (min: number, margen: number) => {
      const base = new Date(Date.now() - min * 60000);
      return { fecha: localDate(base) as any, horaSalida: localHM(base), margenToleranciaMinutos: margen };
    };

    it('dentro de tolerancia → false', () => {
      const r = (service as any).calcularRetraso(progHaceMin(5, 10)); // 5 - 10 < 0
      expect(r.estaRetrasado).toBe(false);
    });

    it('pasado umbral → true con minutos correctos', () => {
      const r = (service as any).calcularRetraso(progHaceMin(30, 5)); // 30 - 5 = 25 > 10
      expect(r.estaRetrasado).toBe(true);
      expect(r.minutosRetraso).toBeGreaterThanOrEqual(24);
      expect(r.minutosRetraso).toBeLessThanOrEqual(26);
    });

    it('sin programación → false', () => {
      const r = (service as any).calcularRetraso(null);
      expect(r).toEqual({ estaRetrasado: false, minutosRetraso: 0 });
    });

    it('horaSalida con segundos "HH:MM:SS" (formato real de la DB) → no NaN', () => {
      const base = new Date(Date.now() - 30 * 60000);
      const prog = {
        fecha: localDate(base) as any,
        horaSalida: `${localHM(base)}:00`, // columna `time` devuelve segundos
        margenToleranciaMinutos: 5,
      };
      const r = (service as any).calcularRetraso(prog);
      expect(Number.isNaN(r.minutosRetraso)).toBe(false);
      expect(r.estaRetrasado).toBe(true);
    });
  });

  // ============================================================
  // 📊 HU-3-002: Panel de control
  // ============================================================

  describe('getTotalPasajerosEnTransito', () => {
    it('suma boletos activos sobre varias programaciones EN_CURSO', async () => {
      programacionRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      boletoRepo.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(8);

      const total = await service.getTotalPasajerosEnTransito();
      expect(total).toBe(13);
      expect(boletoRepo.count).toHaveBeenCalledTimes(3);
    });
  });

  describe('getAlertasOcupacion', () => {
    it('bus en el límite de capacidadMaxima → alerta; debajo → no', async () => {
      programacionRepo.find.mockResolvedValue([
        { id: 1, bus: { id: 10, placa: 'AAA-111', capacidadMaxima: 20 } }, // lleno
        { id: 2, bus: { id: 11, placa: 'BBB-222', capacidadMaxima: 30 } }, // debajo
        { id: 3, bus: { id: 12, placa: 'CCC-333', capacidadMaxima: null } }, // sin capacidad
      ]);
      boletoRepo.count
        .mockResolvedValueOnce(20) // = capacidad → alerta
        .mockResolvedValueOnce(10); // < capacidad → no (la 3ra se descarta antes de contar)

      const alertas = await service.getAlertasOcupacion();
      expect(alertas).toHaveLength(1);
      expect(alertas[0]).toMatchObject({ busId: 10, pasajeros: 20, capacidad: 20 });
    });
  });

  describe('getIncidentesActivos', () => {
    it('excluye incidentes con padre resuelto; sin padre → estado pendiente', async () => {
      incidenteBusRepo.find.mockResolvedValue([
        { id: 1, bus: { id: 10, placa: 'AAA-111' }, descripcion: 'falla', gravedad: 'alto', timestamp: new Date(), incidente: { estado: 'en_revision' } },
        { id: 2, bus: { id: 11, placa: 'BBB-222' }, descripcion: 'choque', gravedad: 'critico', timestamp: new Date(), incidente: { estado: 'resuelto' } },
        { id: 3, bus: { id: 12, placa: 'CCC-333' }, descripcion: 'otro', gravedad: 'bajo', timestamp: new Date(), incidente: null },
      ]);

      const activos = await service.getIncidentesActivos();
      expect(activos).toHaveLength(2);
      expect(activos.find((i) => i.id === 2)).toBeUndefined();
      expect(activos.find((i) => i.id === 3)!.estado).toBe('pendiente');
    });
  });

  describe('getDashboard', () => {
    it('ensambla buses[] + totales coherentes (busesOperando = buses con posición)', async () => {
      // Orden de programacionRepo.find:
      //  #1 getFlotaActivaGlobal → 2 buses con gps (fallback de posición)
      //  #2 getTotalPasajerosEnTransito
      //  #3 getAlertasOcupacion
      programacionRepo.find
        .mockResolvedValueOnce([
          { id: 1, bus: { id: 10, placa: 'AAA-111', capacidadMaxima: 20, gps: { latitude: 5.0, longitude: -75.0 } } },
          { id: 2, bus: { id: 11, placa: 'BBB-222', capacidadMaxima: 30, gps: { latitude: 5.1, longitude: -75.1 } } },
        ])
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
        .mockResolvedValueOnce([
          { id: 1, bus: { id: 10, placa: 'AAA-111', capacidadMaxima: 20 } },
        ]);
      ubicacionRepo.findOne.mockResolvedValue(null); // sin ubicaciones_bus → usa bus.gps
      incidenteBusRepo.findOne.mockResolvedValue(null); // sin incidente ligado en getFlotaActivaGlobal
      boletoRepo.count
        .mockResolvedValueOnce(3) // flota bus 10 (pasajerosCalculados)
        .mockResolvedValueOnce(7) // flota bus 11
        .mockResolvedValueOnce(4) // pasajeros prog 1
        .mockResolvedValueOnce(6) // pasajeros prog 2
        .mockResolvedValueOnce(25); // ocupación prog 1 → alerta (>=20)
      incidenteBusRepo.find.mockResolvedValue([
        { id: 1, bus: { id: 10, placa: 'AAA-111' }, gravedad: 'alto', timestamp: new Date(), incidente: null },
      ]);

      const dash = await service.getDashboard();
      expect(dash.buses).toHaveLength(2);
      expect(dash.buses[0]).toMatchObject({ busId: 10, latitud: 5.0, longitud: -75.0 });
      expect(dash.busesOperando).toBe(2);
      expect(dash.totalActivos).toBe(2);
      expect(dash.pasajerosEnTransito).toBe(10);
      expect(dash.incidentesActivos).toBe(1);
      expect(dash.incidentes).toHaveLength(1);
      expect(dash.alertasOcupacion).toBe(1);
    });
  });
});
