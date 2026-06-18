import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { MensajeService } from './mensaje.service';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';
import { GrupoMembresiaLog } from 'src/grupo/entities/grupo-membresia-log.entity';

// Fábrica de repositorio mock con los métodos que usa el service.
const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

describe('MensajeService', () => {
  let service: MensajeService;
  let mensajeRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    mensajeRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MensajeService,
        { provide: getRepositoryToken(Mensaje), useValue: mensajeRepo },
        { provide: getRepositoryToken(DestinatarioGrupo), useValue: mockRepo() },
        { provide: getRepositoryToken(GrupoPersona), useValue: mockRepo() },
        { provide: getRepositoryToken(GrupoMembresiaLog), useValue: mockRepo() },
      ],
    }).compile();

    service = module.get<MensajeService>(MensajeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enviarMensajePrivado (límite 500)', () => {
    it('acepta contenido de exactamente 500 caracteres y persiste', async () => {
      const contenido = 'a'.repeat(500);
      mensajeRepo.create.mockReturnValue({ contenido });
      mensajeRepo.save.mockResolvedValue({ id: 1, contenido });

      const res = await service.enviarMensajePrivado('e1', 'r1', contenido);

      expect(mensajeRepo.create).toHaveBeenCalledTimes(1);
      expect(mensajeRepo.save).toHaveBeenCalledTimes(1);
      expect(res).toEqual({ id: 1, contenido });
    });

    it('rechaza contenido de 501 caracteres con BadRequestException y NO guarda', async () => {
      const contenido = 'a'.repeat(501);

      await expect(
        service.enviarMensajePrivado('e1', 'r1', contenido),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mensajeRepo.save).not.toHaveBeenCalled();
    });

    it('persiste con receptor {id} y ubicacion serializada como JSON', async () => {
      const ubicacion = { lat: 4.65, lng: -74.05 };
      mensajeRepo.create.mockReturnValue({});
      mensajeRepo.save.mockResolvedValue({ id: 9 });

      await service.enviarMensajePrivado('e1', 'r1', 'hola', ubicacion);

      expect(mensajeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contenido: 'hola',
          emisor: { id: 'e1' },
          receptor: { id: 'r1' },
          ubicacion: JSON.stringify(ubicacion),
        }),
      );
    });

    it('deja ubicacion en undefined cuando no se adjunta', async () => {
      mensajeRepo.create.mockReturnValue({});
      mensajeRepo.save.mockResolvedValue({ id: 10 });

      await service.enviarMensajePrivado('e1', 'r1', 'sin ubicacion');

      expect(mensajeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ubicacion: undefined }),
      );
    });
  });

  describe('marcarComoLeido', () => {
    it('setea leidoAt con un timestamp y guarda', async () => {
      const mensaje: any = { id: 5, leidoAt: undefined };
      mensajeRepo.findOne.mockResolvedValue(mensaje);
      mensajeRepo.save.mockImplementation(async (m: any) => m);

      const res = await service.marcarComoLeido(5);

      expect(res.leidoAt).toBeInstanceOf(Date);
      expect(mensajeRepo.save).toHaveBeenCalledTimes(1);
    });

    it('lanza error si el mensaje no existe', async () => {
      mensajeRepo.findOne.mockResolvedValue(null);

      await expect(service.marcarComoLeido(999)).rejects.toThrow('Mensaje no encontrado');
      expect(mensajeRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('obtenerHistorialPrivado', () => {
    it('consulta bidireccional ordenada ASC y aplana a emisorId/receptorId', async () => {
      const entities = [
        {
          id: 1,
          contenido: 'hola',
          emisor: { id: 'e1', nombre: 'Ana' },
          receptor: { id: 'r1', nombre: 'Bob' },
          ubicacion: null,
          fechaEnvio: new Date('2020-01-01T10:00:00Z'),
          leidoAt: null,
        },
      ];
      mensajeRepo.find.mockResolvedValue(entities);

      const res = await service.obtenerHistorialPrivado('e1', 'r1');

      // Verifica que la consulta cubre ambos sentidos y orden ascendente.
      expect(mensajeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { emisor: { id: 'e1' }, receptor: { id: 'r1' } },
            { emisor: { id: 'r1' }, receptor: { id: 'e1' } },
          ],
          order: { fechaEnvio: 'ASC' },
        }),
      );

      // Verifica el aplanado que consume el front.
      expect(res[0]).toEqual(
        expect.objectContaining({
          id: 1,
          emisorId: 'e1',
          emisorNombre: 'Ana',
          receptorId: 'r1',
        }),
      );
    });
  });
});
