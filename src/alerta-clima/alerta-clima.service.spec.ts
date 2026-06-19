import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AlertaClimaService } from './alerta-clima.service';
import { AlertaClima } from './entities/alerta-clima.entity';
import { Persona } from 'src/persona/entities/persona.entity';

describe('AlertaClimaService', () => {
  let service: AlertaClimaService;
  let alertaRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let personaRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    alertaRepo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'a1', ...x })),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    personaRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertaClimaService,
        { provide: getRepositoryToken(AlertaClima), useValue: alertaRepo },
        { provide: getRepositoryToken(Persona), useValue: personaRepo },
      ],
    }).compile();

    service = module.get(AlertaClimaService);
  });

  describe('crear', () => {
    it('hace snapshot del email de la persona y normaliza la hora', async () => {
      personaRepo.findOne.mockResolvedValue({ id: 'p1', email: 'a@b.com' });
      alertaRepo.findOne.mockResolvedValue(null);
      await service.crear('p1', { horaViaje: '7:5', canal: 'email' });
      expect(alertaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          persona: { id: 'p1' },
          email: 'a@b.com',
          horaViaje: '07:05:00',
          canal: 'email',
          telegramChatId: null,
          estado: 'activa',
        }),
      );
    });

    it('lanza NotFound si la persona no existe', async () => {
      personaRepo.findOne.mockResolvedValue(null);
      await expect(
        service.crear('x', { horaViaje: '07:00', canal: 'email' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('reusa la alerta activa existente (idempotente) y resetea anti-dup', async () => {
      personaRepo.findOne.mockResolvedValue({ id: 'p1', email: 'a@b.com' });
      alertaRepo.findOne.mockResolvedValue({
        id: 'a1',
        ultimaNotificacion: new Date(),
        estado: 'activa',
      });
      await service.crear('p1', { horaViaje: '08:00', canal: 'email' });
      expect(alertaRepo.create).not.toHaveBeenCalled();
      expect(alertaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a1', ultimaNotificacion: null, horaViaje: '08:00:00' }),
      );
    });
  });

  describe('construirMensaje', () => {
    it('lluvia > 50% → mensaje de lluvia con recomendación de paraguas', () => {
      const m = service.construirMensaje({
        ciudad: 'Bogota',
        temp: 18,
        probLluvia: 80,
        condicion: 'lluvia',
      });
      expect(m.lluvia).toBe(true);
      expect(m.pronostico).toContain('80%');
      expect(m.recomendacion.toLowerCase()).toContain('paraguas');
    });

    it('lluvia <= 50% → mensaje favorable simple', () => {
      const m = service.construirMensaje({
        ciudad: 'Bogota',
        temp: 22,
        probLluvia: 20,
        condicion: 'soleado',
      });
      expect(m.lluvia).toBe(false);
      expect(m.pronostico.toLowerCase()).toContain('favorable');
    });
  });

  describe('enVentana / notificadaHoy', () => {
    it('enVentana true solo dentro de las 2h previas al viaje', () => {
      const viaje = '08:00';
      expect(service.enVentana(viaje, new Date('2026-06-18T06:30:00'))).toBe(true);
      expect(service.enVentana(viaje, new Date('2026-06-18T07:59:00'))).toBe(true);
      expect(service.enVentana(viaje, new Date('2026-06-18T05:30:00'))).toBe(false); // >2h antes
      expect(service.enVentana(viaje, new Date('2026-06-18T08:30:00'))).toBe(false); // ya pasó
    });

    it('notificadaHoy distingue mismo día vs otro día', () => {
      const ahora = new Date('2026-06-18T06:30:00');
      expect(service.notificadaHoy(new Date('2026-06-18T06:00:00'), ahora)).toBe(true);
      expect(service.notificadaHoy(new Date('2026-06-17T06:00:00'), ahora)).toBe(false);
      expect(service.notificadaHoy(null, ahora)).toBe(false);
    });
  });

  describe('findPendientes', () => {
    it('incluye solo activas en ventana y no notificadas hoy', async () => {
      const ahora = new Date('2026-06-18T06:30:00');
      alertaRepo.find.mockResolvedValue([
        { id: 'enVentana', horaViaje: '08:00:00', ultimaNotificacion: null },
        { id: 'fueraVentana', horaViaje: '15:00:00', ultimaNotificacion: null },
        { id: 'yaNotificada', horaViaje: '08:00:00', ultimaNotificacion: ahora },
      ]);
      const res = await service.findPendientes(ahora);
      expect(res.map((a) => a.id)).toEqual(['enVentana']);
      expect(alertaRepo.find).toHaveBeenCalledWith({ where: { estado: 'activa' } });
    });
  });

  describe('desactivar', () => {
    it('pone estado inactiva', async () => {
      alertaRepo.findOne.mockResolvedValue({ id: 'a1', estado: 'activa' });
      await service.desactivar('a1');
      expect(alertaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'inactiva' }),
      );
    });

    it('lanza NotFound si no existe', async () => {
      alertaRepo.findOne.mockResolvedValue(null);
      await expect(service.desactivar('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
