import { Module } from '@nestjs/common';
import { DestinatarioPersonaService } from './destinatario_persona.service';
import { DestinatarioPersonaController } from './destinatario_persona.controller';

@Module({
    controllers: [DestinatarioPersonaController],
    providers: [DestinatarioPersonaService],
})
export class DestinatarioPersonaModule {}
