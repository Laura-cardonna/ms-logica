import { Injectable } from '@nestjs/common';
import { CreateDestinatarioDto } from './dto/create-destinatario.dto';
import { UpdateDestinatarioDto } from './dto/update-destinatario.dto';

@Injectable()
export class DestinatarioService {
  create(createDestinatarioDto: CreateDestinatarioDto) {
    return 'This action adds a new destinatario';
  }

  findAll() {
    return `This action returns all destinatario`;
  }

  findOne(id: number) {
    return `This action returns a #${id} destinatario`;
  }

  update(id: number, updateDestinatarioDto: UpdateDestinatarioDto) {
    return `This action updates a #${id} destinatario`;
  }

  remove(id: number) {
    return `This action removes a #${id} destinatario`;
  }
}
