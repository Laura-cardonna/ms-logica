import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { MensajeGateway } from './mensaje.gateway'; // <-- Importamos el Gateway

@Module({
  imports: [
    TypeOrmModule.forFeature([Mensaje, DestinatarioGrupo])
  ],
  controllers: [MensajeController],
  providers: [MensajeService, MensajeGateway], // <-- Agregamos MensajeGateway aquí
  exports: [MensajeService],
})
export class MensajeModule {}