import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';

@Module({
  imports: [
    // Registramos las entidades para que el Repository pueda ser inyectado en el Service
    TypeOrmModule.forFeature([Mensaje, DestinatarioGrupo])
  ],
  controllers: [MensajeController],
  providers: [MensajeService],
  exports: [MensajeService], // Lo exportamos por si otro módulo necesita enviar mensajes
})
export class MensajeModule {}