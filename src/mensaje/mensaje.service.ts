import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';

@Injectable()
export class MensajeService {
  constructor(
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,

    @InjectRepository(DestinatarioGrupo)
    private readonly destGrupoRepository: Repository<DestinatarioGrupo>,
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

  // Obtener historial del chat de un grupo
  async obtenerMensajesPorGrupo(grupoId: number) {
    const relaciones = await this.destGrupoRepository.find({
      where: { grupo: { id: grupoId } },
      relations: ['mensaje', 'mensaje.emisor'],
      order: { mensaje: { fechaEnvio: 'ASC' } }, // Orden cronológico
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