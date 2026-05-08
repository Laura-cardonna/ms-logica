import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Direccion } from 'src/direccion/entities/direccion.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Nodo } from 'src/nodo/entities/nodo.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Historial } from 'src/historial/entities/historial.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { DestinatarioPersona } from 'src/destinatario_persona/entities/destinatario_persona.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { MetodoPago } from 'src/metodo_pago/entities/metodo_pago.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Direccion,
      Ciudadano,
      Nodo,
      Paradero,
      Ruta,
      Historial,
      Persona,
      Grupo,
      GrupoPersona,
      Mensaje,
      DestinatarioPersona,
      DestinatarioGrupo,
      MetodoPago,
      MetodoPagoCiudadano,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
