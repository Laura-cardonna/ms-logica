import { MonitoreoService } from './monitoreo.service';

// HU-ENTR-3-003: pruebas del job de proximidad (notificarBusProximo).
// Se prueba el método de forma aislada inyectando solo las dependencias que usa.
describe('MonitoreoService — job de proximidad (HU-3-003)', () => {
  let service: MonitoreoService;
  let suscripcionRepo: { find: jest.Mock; save: jest.Mock };
  let notificacionService: { crearNotificacion: jest.Mock };
  let gateway: { emitirAlertaBusProximo: jest.Mock };
  let etaSpy: jest.SpyInstance;

  const bus = { id: 7, placa: 'XYZ-123' } as any;

  const nuevaSub = (over: Partial<any> = {}) => ({
    id: 's1',
    persona: { id: 'p1' },
    paradero: { id: 2, nombre: 'Paradero Centro' },
    ruta: { nombre: 'Ruta Centro - Sur' },
    minutosAnticipacion: 10,
    estado: 'activa',
    notificadaEn: null,
    ...over,
  });

  beforeEach(() => {
    suscripcionRepo = { find: jest.fn(), save: jest.fn((x) => Promise.resolve(x)) };
    notificacionService = { crearNotificacion: jest.fn().mockResolvedValue({}) };
    gateway = { emitirAlertaBusProximo: jest.fn() };

    // Constructor: solo importan suscripcionRepo, notificacionService y gateway.
    service = new MonitoreoService(
      {} as any, // ubicacionRepo
      {} as any, // busRepo
      {} as any, // rutaRepo
      {} as any, // paraderoRepo
      {} as any, // programacionRepo
      {} as any, // incidenteRepo
      {} as any, // boletoRepo
      {} as any, // incidentePadreRepo
      suscripcionRepo as any,
      {} as any, // httpService
      notificacionService as any,
      gateway as any,
    );

    etaSpy = jest.spyOn(service, 'getEtaParaParadero');
  });

  const correrJob = () => (service as any).notificarBusProximo(bus, 1);

  it('ETA <= umbral y no notificada → notifica, emite y marca notificadaEn', async () => {
    const sub = nuevaSub();
    suscripcionRepo.find.mockResolvedValue([sub]);
    etaSpy.mockResolvedValue({ etaMinutos: 8 } as any);

    await correrJob();

    expect(notificacionService.crearNotificacion).toHaveBeenCalledTimes(1);
    expect(gateway.emitirAlertaBusProximo).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        rutaNombre: 'Ruta Centro - Sur',
        etaMinutos: 8,
        placa: 'XYZ-123',
        busId: 7,
        paraderoNombre: 'Paradero Centro',
      }),
    );
    expect(sub.notificadaEn).toBeInstanceOf(Date);
    expect(suscripcionRepo.save).toHaveBeenCalledWith(sub);
  });

  it('ETA > umbral → no notifica', async () => {
    suscripcionRepo.find.mockResolvedValue([nuevaSub()]);
    etaSpy.mockResolvedValue({ etaMinutos: 20 } as any);

    await correrJob();

    expect(notificacionService.crearNotificacion).not.toHaveBeenCalled();
    expect(gateway.emitirAlertaBusProximo).not.toHaveBeenCalled();
  });

  it('ya notificada (notificadaEn set) y dentro de ventana → no reenvía', async () => {
    suscripcionRepo.find.mockResolvedValue([nuevaSub({ notificadaEn: new Date() })]);
    etaSpy.mockResolvedValue({ etaMinutos: 5 } as any);

    await correrJob();

    expect(notificacionService.crearNotificacion).not.toHaveBeenCalled();
    expect(gateway.emitirAlertaBusProximo).not.toHaveBeenCalled();
  });

  it('bus se aleja (ETA > umbral) y estaba notificada → resetea notificadaEn', async () => {
    const sub = nuevaSub({ notificadaEn: new Date() });
    suscripcionRepo.find.mockResolvedValue([sub]);
    etaSpy.mockResolvedValue({ etaMinutos: 18 } as any);

    await correrJob();

    expect(sub.notificadaEn).toBeNull();
    expect(suscripcionRepo.save).toHaveBeenCalledWith(sub);
  });

  it('sin suscripciones → no consulta ETA', async () => {
    suscripcionRepo.find.mockResolvedValue([]);
    await correrJob();
    expect(etaSpy).not.toHaveBeenCalled();
  });
});
