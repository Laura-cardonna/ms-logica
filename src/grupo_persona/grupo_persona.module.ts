import { Module } from '@nestjs/common';
import { GrupoPersonaService } from './grupo_persona.service';
import { GrupoPersonaController } from './grupo_persona.controller';

@Module({
    controllers: [GrupoPersonaController],
    providers: [GrupoPersonaService],
})
export class GrupoPersonaModule {}
