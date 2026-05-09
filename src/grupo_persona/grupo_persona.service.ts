import { Injectable } from '@nestjs/common';
import { CreateGrupoPersonaDto } from './dto/create-grupo_persona.dto';
import { UpdateGrupoPersonaDto } from './dto/update-grupo_persona.dto';

@Injectable()
export class GrupoPersonaService {
  create(createGrupoPersonaDto: CreateGrupoPersonaDto) {
    return 'This action adds a new grupo_persona';
  }

  findAll() {
    return `This action returns all grupo_persona`;
  }

  findOne(id: number) {
    return `This action returns a #${id} grupo_persona`;
  }

  update(id: number, updateGrupoPersonaDto: UpdateGrupoPersonaDto) {
    return `This action updates a #${id} grupo_persona`;
  }

  remove(id: number) {
    return `This action removes a #${id} grupo_persona`;
  }
}
