import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { Persona } from 'src/persona/entities/persona.entity';

@Injectable()
export class NotificacionService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
  ) {}

  async crearNotificacion(persona: Persona, titulo: string, mensaje: string) {
    const nueva = this.notificacionRepository.create({
      persona,
      titulo,
      mensaje,
    });
    return await this.notificacionRepository.save(nueva);
  }

  async obtenerPorPersona(personaId: string) {
    return await this.notificacionRepository.find({
      where: { persona: { id: personaId } },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async marcarComoLeida(id: string) {
    return await this.notificacionRepository.update(id, { leida: true });
  }

  async contarNoLeidas(personaId: string) {
    return await this.notificacionRepository.count({
      where: { persona: { id: personaId }, leida: false },
    });
  }

 async contarLecturasAlerta(mensajeId: number): Promise<{ total: number; leidas: number }> {
    const titulo = `🚨 ALERTA#${mensajeId}`;
    const total = await this.notificacionRepository.count({ where: { titulo } });
    const leidas = await this.notificacionRepository.count({ where: { titulo, leida: true } });
    return { total, leidas };
  }

  async marcarAlertaComoLeida(mensajeId: number, personaId: string): Promise<void> {
    const titulo = `🚨 ALERTA#${mensajeId}`;
    await this.notificacionRepository.update(
      { titulo, persona: { id: personaId } },
      { leida: true },
    );
  }
  
}