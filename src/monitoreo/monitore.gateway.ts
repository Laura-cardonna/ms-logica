import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
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
}