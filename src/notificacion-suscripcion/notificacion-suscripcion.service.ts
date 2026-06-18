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
    // Dedupe: una sola suscripción activa por persona+ruta+paradero. Si ya existe,
    // se reutiliza (idempotente) en vez de acumular filas con cada click de "Avisarme".
    const existentes = await this.suscripcionRepo.find({
      where: {
        persona: { id: personaId },
        ruta: { id: dto.rutaId },
        paradero: { id: dto.paraderoId },
        estado: 'activa',
      } as any,
      order: { fechaCreacion: 'ASC' },
    });

    if (existentes.length) {
      const [canonica, ...duplicadas] = existentes;
      // Colapsar cualquier duplicada previa (datos sucios de clicks anteriores).
      for (const dup of duplicadas) {
        dup.estado = 'inactiva';
        await this.suscripcionRepo.save(dup);
      }
      canonica.minutosAnticipacion = dto.minutosAnticipacion;
      canonica.notificadaEn = null; // reinicia el cooldown para el nuevo acercamiento
      return await this.suscripcionRepo.save(canonica);
    }

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
