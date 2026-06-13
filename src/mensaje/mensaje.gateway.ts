import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MensajeService } from './mensaje.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
export class MensajeGateway {
  @WebSocketServer()
  server!: Server;
    
  constructor(
    private readonly mensajeService: MensajeService,
    // Inyectamos el repositorio aquí para validar bloqueos en tiempo real sin dependencias circulares
    @InjectRepository(GrupoPersona)
    private readonly grupoPersonaRepository: Repository<GrupoPersona>,
  ) {}

  // MODIFICADO: Ahora el front también envía el personaId al unirse
  @SubscribeMessage('unirseAGrupo')
  handleJoinGroup(
    @MessageBody() data: { grupoId: number; personaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `grupo_${data.grupoId}`;
    client.join(roomName);
    
    // Unimos al cliente a una sala única para su usuario (útil para alertas directas)
    if (data.personaId) {
      client.join(`user_${data.personaId}`);
    }
    console.log(`Cliente ${client.id} (Usuario: ${data.personaId}) se unió a la sala: ${roomName}`);
  }

  @SubscribeMessage('salirDeGrupo')
  handleLeaveGroup(
    @MessageBody() data: { grupoId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `grupo_${data.grupoId}`;
    client.leave(roomName);
    console.log(`Cliente ${client.id} salió de la sala: ${roomName}`);
  }

  @SubscribeMessage('enviarMensaje')
  async handleSendMessage(
    @MessageBody() data: { emisorId: string; grupoId: number; contenido: string },
    @ConnectedSocket() client: Socket, // <-- Agregamos el cliente para responderle si hay error
  ) {
    try {
      // 🚨 CONTROL DE SEGURIDAD: Verificar si el usuario está bloqueado antes de procesar
      const membresia = await this.grupoPersonaRepository.findOne({
        where: { grupo: { id: Number(data.grupoId) }, persona: { id: String(data.emisorId) } }
      });

      if (!membresia || membresia.rol === 'bloqueado') {
        console.log(`🚫 Mensaje rechazado: El usuario ${data.emisorId} está bloqueado en el grupo ${data.grupoId}`);
        client.emit('errorChat', { mensaje: 'No tienes permisos para enviar mensajes en este grupo.' });
        return; 
      }

      // Si pasa el filtro, se guarda el mensaje de forma normal
      const mensajeGuardado = await this.mensajeService.enviarMensajeAGrupo(
        data.emisorId,
        Number(data.grupoId),
        data.contenido,
      );

      const mensajeParaEmitir = {
        id: mensajeGuardado.id,
        contenido: mensajeGuardado.contenido,
        fechaEnvio: mensajeGuardado.fechaEnvio || new Date(),
        grupoId: Number(data.grupoId),
        emisorId: data.emisorId,
        emisorNombre: 'Usuario' 
      };

      const historial = await this.mensajeService.obtenerMensajesPorGrupo(Number(data.grupoId));
      const coincidencia = historial.find(m => m.id === mensajeGuardado.id);
      
      if (coincidencia) {
        mensajeParaEmitir.emisorNombre = coincidencia.emisorNombre || 'Usuario';
      }

      const roomName = `grupo_${data.grupoId}`;
      this.server.to(roomName).emit('recibirMensaje', mensajeParaEmitir);

    } catch (error) {
      console.error('Error procesando el mensaje en el socket gateway:', error);
    }
  }

  @SubscribeMessage('notificarNuevoGrupo')
  handleNuevoGrupo(@MessageBody() data: { miembrosIds: string[] }) {
    try {
      this.server.emit('grupoCreadoRemoto', data);
    } catch (error) {
      console.error('Error al emitir notificación de nuevo grupo:', error);
    }
  }

/**
   * ⚡ MÉTODO MODIFICADO: Emite el bloqueo y remueve el socket de la sala del grupo
   */
  notificarBloqueo(grupoId: number, personaId: string) {
    const roomPersonal = `user_${personaId}`;
    const roomGrupo = `grupo_${grupoId}`;

    // 1. Emitimos la orden para que el front cambie la interfaz a rojo
    this.server.to(roomPersonal).emit('usuarioBloqueado', { grupoId: Number(grupoId) });

    // 2. 🚀 NUEVO: Buscamos todos los sockets conectados en la sala privada de ese usuario y los sacamos del grupo
    this.server.in(roomPersonal).socketsLeave(roomGrupo);

    console.log(`📢 Evento de bloqueo emitido en tiempo real y socket removido de la sala ${roomGrupo} para el usuario ${personaId}`);
  }
}