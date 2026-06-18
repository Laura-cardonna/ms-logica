import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificacionSuscripcion } from './entities/notificacion-suscripcion.entity';
import { CreateNotificacionSuscripcionDto } from './dto/create-notificacion-suscripcion.dto';

@Injectable()
export class NotificacionSuscripcionService {
  constructor(
    @InjectRepository(NotificacionSuscripcion)
    private readonly suscripcionRepo: Repository<NotificacionSuscripcion>,
  ) {}

  async crear(personaId: string, dto: CreateNotificacionSuscripcionDto) {
    const suscripcion = this.suscripcionRepo.create({
      persona: { id: personaId } as any,
      ruta: { id: dto.rutaId } as any,
      paradero: { id: dto.paraderoId } as any,
      minutosAnticipacion: dto.minutosAnticipacion,
      estado: 'activa',
      notificadaEn: null,
    });
    return await this.suscripcionRepo.save(suscripcion);
  }

  async listarPorPersona(personaId: string) {
    return await this.suscripcionRepo.find({
      where: { persona: { id: personaId } },
      relations: ['ruta', 'paradero'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  async desactivar(id: string) {
    const suscripcion = await this.suscripcionRepo.findOne({ where: { id } });
    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }
    suscripcion.estado = 'inactiva';
    return await this.suscripcionRepo.save(suscripcion);
  }
}
