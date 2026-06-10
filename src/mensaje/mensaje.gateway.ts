import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MensajeService } from './mensaje.service';

// Configuramos el Gateway. Permite CORS para conectar con Angular sin problemas.
@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
export class MensajeGateway {
  @WebSocketServer()
    server!: Server; // <-- Le agregamos el signo de exclamación (!) antes de los dos puntos
    
  constructor(private readonly mensajeService: MensajeService) {}

  // Cuando un usuario entra al chat de un grupo, el front emite este evento para unirlo a la sala
  @SubscribeMessage('unirseAGrupo')
  handleJoinGroup(
    @MessageBody() data: { grupoId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `grupo_${data.grupoId}`;
    client.join(roomName);
    console.log(`Cliente ${client.id} se unió a la sala: ${roomName}`);
  }

  // Cuando un usuario sale del chat del grupo o cambia de vista
  @SubscribeMessage('salirDeGrupo')
  handleLeaveGroup(
    @MessageBody() data: { grupoId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `grupo_${data.grupoId}`;
    client.leave(roomName);
    console.log(`Cliente ${client.id} salió de la sala: ${roomName}`);
  }

  // Evento principal para enviar y distribuir mensajes en tiempo real
@SubscribeMessage('enviarMensaje')
  async handleSendMessage(
    @MessageBody() data: { emisorId: string; grupoId: number; contenido: string },
  ) {
    try {
      // 1. Corregido: Pasamos los 3 argumentos exactos que pide tu servicio (emisorId, grupoId, contenido)
      const mensajeGuardado = await this.mensajeService.enviarMensajeAGrupo(
        data.emisorId,
        Number(data.grupoId),
        data.contenido,
      );

      // 2. Estructuramos el objeto de emisión base
      const mensajeParaEmitir = {
        id: mensajeGuardado.id,
        contenido: mensajeGuardado.contenido,
        fechaEnvio: mensajeGuardado.fechaEnvio || new Date(),
        grupoId: Number(data.grupoId),
        emisorId: data.emisorId,
        emisorNombre: 'Usuario' // Valor por defecto por si acaso
      };

      // Buscamos el nombre real mapeado en el historial
      const historial = await this.mensajeService.obtenerMensajesPorGrupo(Number(data.grupoId));
      const coincidencia = historial.find(m => m.id === mensajeGuardado.id);
      
      // Corregido: Usamos el operador || para asegurar que si viene undefined, sea un string limpio y no rompa tipos
      if (coincidencia) {
        mensajeParaEmitir.emisorNombre = coincidencia.emisorNombre || 'Usuario';
      }

      // 3. Emitimos a la sala del grupo correspondiente
      const roomName = `grupo_${data.grupoId}`;
      this.server.to(roomName).emit('recibirMensaje', mensajeParaEmitir);
      
      console.log(`Mensaje emitido con éxito a la sala ${roomName}:`, mensajeParaEmitir);

    } catch (error) {
      console.error('Error procesando el mensaje en el socket gateway:', error);
    }
  }

    @SubscribeMessage('notificarNuevoGrupo')
  handleNuevoGrupo(@MessageBody() data: { miembrosIds: string[] }) {
    try {
      // Emitimos un evento global o directo a los usuarios conectados
      // socket.io permite enviar a todos los clientes que estén escuchando este evento
      this.server.emit('grupoCreadoRemoto', data);
      console.log('Notificación de nuevo grupo enviada a la red de sockets para los usuarios:', data.miembrosIds);
    } catch (error) {
      console.error('Error al emitir notificación de nuevo grupo:', error);
    }
  }
}