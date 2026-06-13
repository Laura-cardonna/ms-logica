import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import {GrupoPersona} from 'src/grupo_persona/entities/grupo_persona.entity'; // <-- Importamos la entidad para el repositorio
@Injectable()
export class MensajeService {
  constructor(
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,

    @InjectRepository(DestinatarioGrupo)
    private readonly destGrupoRepository: Repository<DestinatarioGrupo>,

    @InjectRepository(GrupoPersona)
    private readonly grupoPersonaRepository: Repository<GrupoPersona>,
  ) {}

  // Enviar mensaje a un grupo
  async enviarMensajeAGrupo(emisorId: string, grupoId: number, contenido: string) {
    // 1. Creamos el mensaje base
    const nuevoMensaje = this.mensajeRepository.create({
      contenido,
      emisor: { id: emisorId } as Persona,
    });

    const mensajeGuardado = await this.mensajeRepository.save(nuevoMensaje);

    // 2. Creamos la relación con el grupo
    const destinatario = this.destGrupoRepository.create({
      mensaje: mensajeGuardado,
      grupo: { id: grupoId } as Grupo,
    });

    await this.destGrupoRepository.save(destinatario);

    return { ...mensajeGuardado, grupoId };
  }

// Obtener historial del chat de un grupo validando bloqueos
  async obtenerMensajesPorGrupo(grupoId: number, personaId?: string) {
    // 🚨 1. Si viene el personaId, validamos su rol en el grupo
    if (personaId) {
      const membresia = await this.grupoPersonaRepository.findOne({
        where: { grupo: { id: Number(grupoId) }, persona: { id: String(personaId) } }
      });

      // Si está bloqueado, devolvemos el historial vacío de inmediato por seguridad
      if (membresia && membresia.rol === 'bloqueado') {
        return [];
      }
    }

    // 2. Si no está bloqueado, ejecuta tu consulta normal y limpia que ya tenías
    const relaciones = await this.destGrupoRepository.find({
      where: { grupo: { id: grupoId } },
      relations: ['mensaje', 'mensaje.emisor'],
      order: { mensaje: { fechaEnvio: 'ASC' } }, 
    });

    return relaciones.map(rel => ({
      id: rel.mensaje?.id,
      contenido: rel.mensaje?.contenido,
      fechaEnvio: rel.mensaje?.fechaEnvio,
      emisorNombre: rel.mensaje?.emisor?.nombre,
      emisorId: rel.mensaje?.emisor?.id,
    }));
  }
}