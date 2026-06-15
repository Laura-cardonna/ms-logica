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
    @InjectRepository(GrupoPersona)
    private readonly grupoPersonaRepository: Repository<GrupoPersona>,
  ) {}

  @SubscribeMessage('unirseAGrupo')
  handleJoinGroup(
    @MessageBody() data: { grupoId: number; personaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `grupo_${data.grupoId}`;
    client.join(roomName);
    
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
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const membresia = await this.grupoPersonaRepository.findOne({
        where: { grupo: { id: Number(data.grupoId) }, persona: { id: String(data.emisorId) } }
      });

      if (!membresia || membresia.rol === 'bloqueado') {
        console.log(`🚫 Mensaje rechazado: El usuario ${data.emisorId} está bloqueado en el grupo ${data.grupoId}`);
        client.emit('errorChat', { mensaje: 'No tienes permisos para enviar mensajes en este grupo.' });
        return; 
      }

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

  notificarBloqueo(grupoId: number, personaId: string) {
    const roomPersonal = `user_${personaId}`;
    const roomGrupo = `grupo_${grupoId}`;

    this.server.to(roomPersonal).emit('usuarioBloqueado', { grupoId: Number(grupoId) });
    this.server.in(roomPersonal).socketsLeave(roomGrupo);

    console.log(`📢 Evento de bloqueo emitido en tiempo real y socket removido de la sala ${roomGrupo} para el usuario ${personaId}`);
  }

  @SubscribeMessage('enviarMensajePrivado')
  async handleMensajePrivado(
    @MessageBody() data: { emisorId: string; receptorId: string; contenido: string; ubicacion?: any },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const mensajeParaEmitir = {
        id: Date.now(), 
        emisorId: data.emisorId,
        receptorId: data.receptorId,
        contenido: data.contenido,
        ubicacion: data.ubicacion,
        fechaEnvio: new Date(),
        leidoAt: null
      };

      const roomDestinatario = `user_${data.receptorId}`;
      this.server.to(roomDestinatario).emit('recibirMensajePrivado', mensajeParaEmitir);

      console.log(`💬 Mensaje privado enviado de ${data.emisorId} a ${data.receptorId}`);
    } catch (error) {
      console.error('Error procesando mensaje privado en el gateway:', error);
      client.emit('errorChat', { mensaje: 'No se pudo enviar el mensaje privado.' });
    }
  }

  // ✨ AQUÍ INTEGRAMOS LA BASE DE DATOS SIN TOCAR TUS PARÁMETROS ORIGINALES
  @SubscribeMessage('marcarMensajeLeido')
  async handleMensajeLeido(
    @MessageBody() data: { mensajeId: number; emisorOriginalId: string; fechaLeido: Date },
  ) {
    try {
      // 1. Guardar la fecha real de lectura en MySQL usando tu MensajeService
      await this.mensajeService.marcarComoLeido(data.mensajeId);

      // 2. Avisar en tiempo real al usuario original para que le ponga el "check azul"
      const roomEmisorOriginal = `user_${data.emisorOriginalId}`;
      this.server.to(roomEmisorOriginal).emit('mensajeLeidoConfirmado', data);
      
      console.log(`✅ Mensaje ${data.mensajeId} marcado como leído en BD y notificado.`);
    } catch (error) {
      console.error('Error al confirmar lectura:', error);
    }
  }
}