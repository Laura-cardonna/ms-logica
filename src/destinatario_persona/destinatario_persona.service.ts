import { Injectable } from '@nestjs/common';
import { CreateDestinatarioPersonaDto } from './dto/create-destinatario_persona.dto';
import { UpdateDestinatarioPersonaDto } from './dto/update-destinatario_persona.dto';

@Injectable()
export class DestinatarioPersonaService {
  create(createDestinatarioPersonaDto: CreateDestinatarioPersonaDto) {
    return 'This action adds a new destinatario_persona';
  }

  findAll() {
    return `This action returns all destinatario_persona`;
  }

  findOne(id: number) {
    return `This action returns a #${id} destinatario_persona`;
  }

  update(id: number, updateDestinatarioPersonaDto: UpdateDestinatarioPersonaDto) {
    return `This action updates a #${id} destinatario_persona`;
  }

  remove(id: number) {
    return `This action removes a #${id} destinatario_persona`;
  }
}
