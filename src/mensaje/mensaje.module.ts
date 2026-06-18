import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { MensajeGateway } from './mensaje.gateway'; 
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity'; 
import { GrupoMembresiaLog } from 'src/grupo/entities/grupo-membresia-log.entity'; 

// 🌟 Importamos los módulos correspondientes en lugar de los servicios sueltos
import { BoletoModule } from 'src/boleto/boleto.module'; 
import { NotificacionModule } from 'src/notificacion/notificacion.module'; // 🌟 Asegúrate de que esta ruta sea la correcta en tu proyecto

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Mensaje, 
      DestinatarioGrupo, 
      GrupoPersona, 
      GrupoMembresiaLog
    ]),
    BoletoModule, // 🌟 Con esto, MensajeService ya puede usar limpiamente el BoletoService
    NotificacionModule, // 🌟 Con esto, MensajeService ya puede usar limpiamente el NotificacionService
  ],
  controllers: [MensajeController],
  providers: [
    MensajeService, 
    MensajeGateway
  ], 
  exports: [
    MensajeService, 
    MensajeGateway
  ], 
})
export class MensajeModule {}