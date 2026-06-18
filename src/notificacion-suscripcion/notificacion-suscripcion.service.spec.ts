import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificacionSuscripcionService } from './notificacion-suscripcion.service';
import { NotificacionSuscripcion } from './entities/notificacion-suscripcion.entity';

describe('NotificacionSuscripcionService', () => {
  let service: NotificacionSuscripcionService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 's1', ...x })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionSuscripcionService,
        { provide: getRepositoryToken(NotificacionSuscripcion), useValue: repo },
      ],
    }).compile();

    service = module.get(NotificacionSuscripcionService);
  });

  it('crear (sin existente) asocia persona/ruta/paradero y estado activa', async () => {
    repo.find.mockResolvedValue([]); // no hay suscripción previa
    await service.crear('p1', { rutaId: 3, paraderoId: 9, minutosAnticipacion: 10 });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        persona: { id: 'p1' },
        ruta: { id: 3 },
        paradero: { id: 9 },
        minutosAnticipacion: 10,
        estado: 'activa',
        notificadaEn: null,
      }),
    );
    expect(repo.save).toHaveBeenCalled();
  });

  it('crear con triple existente NO inserta: reusa, actualiza minutos y resetea cooldown', async () => {
    const existente = { id: 's1', minutosAnticipacion: 5, notificadaEn: new Date(), estado: 'activa' };
    repo.find.mockResolvedValue([existente]);
    await service.crear('p1', { rutaId: 3, paraderoId: 9, minutosAnticipacion: 15 });
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's1', minutosAnticipacion: 15, notificadaEn: null }),
    );
  });

  it('crear con duplicadas las colapsa (desactiva las extra)', async () => {
    const a = { id: 's1', minutosAnticipacion: 5, notificadaEn: null, estado: 'activa' };
    const b = { id: 's2', minutosAnticipacion: 5, notificadaEn: null, estado: 'activa' };
    repo.find.mockResolvedValue([a, b]);
    await service.crear('p1', { rutaId: 3, paraderoId: 9, minutosAnticipacion: 10 });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 's2', estado: 'inactiva' }));
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 's1', minutosAnticipacion: 10 }));
  });

  it('listarPorPersona filtra por persona', async () => {
    repo.find.mockResolvedValue([{ id: 's1' }]);
    const res = await service.listarPorPersona('p1');
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { persona: { id: 'p1' } } }),
    );
    expect(res).toHaveLength(1);
  });

  it('desactivar pone estado inactiva', async () => {
    repo.findOne.mockResolvedValue({ id: 's1', estado: 'activa' });
    await service.desactivar('s1');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'inactiva' }),
    );
  });

  it('desactivar lanza NotFound si no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.desactivar('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
