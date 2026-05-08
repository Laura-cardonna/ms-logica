import { Module } from '@nestjs/common';
import { DestinatarioService } from './destinatario.service';
import { DestinatarioController } from './destinatario.controller';

@Module({
  controllers: [DestinatarioController],
  providers: [DestinatarioService],
})
export class DestinatarioModule {}
