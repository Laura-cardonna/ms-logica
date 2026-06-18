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

const repoMock = () => ({ find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() });

describe('MonitoreoService', () => {
  let service: MonitoreoService;
  let busRepo: any;
  let paraderoRepo: any;
  let programacionRepo: any;
  let ubicacionRepo: any;

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
        { provide: HttpService, useValue: { post: jest.fn() } },
        { provide: MonitoreoGateway, useValue: { emitirActualizacionBus: jest.fn() } },
      ],
    }).compile();

    service = module.get(MonitoreoService);
    busRepo = module.get(getRepositoryToken(Bus));
    paraderoRepo = module.get(getRepositoryToken(Paradero));
    programacionRepo = module.get(getRepositoryToken(Programacion));
    ubicacionRepo = module.get(getRepositoryToken(UbicacionBus));
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
});
