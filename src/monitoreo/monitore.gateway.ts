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

  // HU-ENTR-3-002: El supervisor se une a una sala específica para recibir toda la flota
  @SubscribeMessage('suscribirseAFlota')
  handleSuscribirseAFlota(@ConnectedSocket() client: Socket) {
    client.join('sala_supervisores');
    console.log(`Supervisor ${client.id} conectado a la flota.`);
  }

  // Método centralizado para emitir actualizaciones. 
  // Se llama desde el MonitoreoService.
  emitirActualizacionBus(busData: any) {
    // Emitimos el evento a todos los clientes en la sala de supervisores
    this.server.to('sala_supervisores').emit('actualizacionBus', busData);
  }
}