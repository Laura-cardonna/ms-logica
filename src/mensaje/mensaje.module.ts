import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { LecturaGrupo } from './entities/lectura_grupo.entity'; // 👈 HU-3-005: lecturas por miembro
import { MensajeGateway } from './mensaje.gateway'; // <-- Importamos el Gateway
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity'; // <-- Importamos la entidad para el repositorio
import { GrupoMembresiaLog } from 'src/grupo/entities/grupo-membresia-log.entity'; // 👈 1. IMPORTA LA ENTIDAD AQUÍ
import { BoletoModule } from 'src/boleto/boleto.module'; // HU-3-008: provee BoletoService
import { NotificacionModule } from 'src/notificacion/notificacion.module'; // HU-3-008: provee NotificacionService


@Module({
  imports: [
    TypeOrmModule.forFeature([Mensaje, DestinatarioGrupo, LecturaGrupo, GrupoPersona, GrupoMembresiaLog]),
    BoletoModule, // exporta BoletoService (alerta masiva)
    NotificacionModule, // exporta NotificacionService (push de alerta masiva)
  ],
  controllers: [MensajeController],
  providers: [MensajeService, MensajeGateway], // GrupoPersona es entidad, no provider
  exports: [MensajeService, MensajeGateway], // <-- Exportamos el servicio y el gateway para que otros módulos puedan usarlos
})
export class MensajeModule {}