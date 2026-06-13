import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrupoService } from './grupo.service';
import { GrupoController } from './grupo.controller';
import { Grupo } from './entities/grupo.entity';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { NotificacionModule } from '../notificacion/notificacion.module'; // <-- Añade esta línea
import { GrupoMembresiaLog } from './entities/grupo-membresia-log.entity';
import {MensajeModule} from '../mensaje/mensaje.module'; // <-- Importamos el módulo de mensajes para usar su gateway

@Module({
  imports: [
    // Aquí le decimos a Nest que este módulo usa estas 3 tablas
    TypeOrmModule.forFeature([Grupo, GrupoPersona, Persona, GrupoMembresiaLog]),
    NotificacionModule, // Importamos el módulo de notificaciones para poder usar su servicio
    MensajeModule, // Importamos el módulo de mensajes para poder usar su gateway
  ],
  controllers: [GrupoController],
  providers: [GrupoService],
})
export class GrupoModule {}