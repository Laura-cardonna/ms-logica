import { Injectable } from '@nestjs/common';
import { CreateDestinatarioGrupoDto } from './dto/create-destinatario_grupo.dto';
import { UpdateDestinatarioGrupoDto } from './dto/update-destinatario_grupo.dto';

@Injectable()
export class DestinatarioGrupoService {
  create(createDestinatarioGrupoDto: CreateDestinatarioGrupoDto) {
    return 'This action adds a new destinatario_grupo';
  }

  findAll() {
    return `This action returns all destinatario_grupo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} destinatario_grupo`;
  }

  update(id: number, updateDestinatarioGrupoDto: UpdateDestinatarioGrupoDto) {
    return `This action updates a #${id} destinatario_grupo`;
  }

  remove(id: number) {
    return `This action removes a #${id} destinatario_grupo`;
  }
}
