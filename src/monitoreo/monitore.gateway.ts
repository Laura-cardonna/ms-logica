import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ 
  cors: { 
    origin: '*' 
  } 
})
export class MonitoreoGateway {
  @WebSocketServer() server!: Server;

  // 🚀 CACHÉ EN MEMORIA: Guarda la última ubicación de todos los buses activos
  private flotaActiva = new Map<number, any>();

  // HU-ENTR-3-002: El supervisor se une a una sala específica
  @SubscribeMessage('suscribirseAFlota')
  handleSuscribirseAFlota(@ConnectedSocket() client: Socket) {
    client.join('sala_supervisores');
    console.log(`Supervisor ${client.id} conectado a la flota.`);
    
    // Al entrar, le enviamos inmediatamente la foto actual de TODOS los buses
    client.emit('actualizacionFlotaGlobal', Array.from(this.flotaActiva.values()));
  }

  // Método llamado desde tu MonitoreoService
  emitirActualizacionBus(busData: any) {
    // 1. Guardamos/Actualizamos el bus en nuestra memoria
    this.flotaActiva.set(busData.busId, busData);

    // 2. Emitimos TODA la flota actualizada a los supervisores
    this.server.to('sala_supervisores').emit('actualizacionFlotaGlobal', Array.from(this.flotaActiva.values()));
  }

  // HU-ENTR-3-003: el ciudadano se une a su sala personal para recibir alertas
  // dirigidas (bus próximo). Sin esto, el socket solo entra a 'user_*' vía grupos.
  @SubscribeMessage('identificarUsuario')
  handleIdentificarUsuario(
    @MessageBody() data: { personaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.personaId) {
      client.join(`user_${data.personaId}`);
      console.log(`Usuario ${data.personaId} (socket ${client.id}) unido a su sala personal.`);
    }
  }

  // HU-ENTR-3-003: alerta de bus próximo dirigida a un ciudadano concreto.
  // Evento EXACTO 'alertaBusProximo' (lo escucha escucharAlertaBus() en el front).
  emitirAlertaBusProximo(personaId: string, payload: any) {
    this.server.to(`user_${personaId}`).emit('alertaBusProximo', payload);
  }
}