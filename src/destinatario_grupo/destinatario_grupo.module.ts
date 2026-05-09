import { Module } from '@nestjs/common';
import { DestinatarioGrupoService } from './destinatario_grupo.service';
import { DestinatarioGrupoController } from './destinatario_grupo.controller';

@Module({
    controllers: [DestinatarioGrupoController],
    providers: [DestinatarioGrupoService],
})
export class DestinatarioGrupoModule {}
