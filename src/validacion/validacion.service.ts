import { Injectable } from '@nestjs/common';
import { CreateValidacionDto } from './dto/create-validacion.dto';
import { UpdateValidacionDto } from './dto/update-validacion.dto';

@Injectable()
export class ValidacionService {
  create(createValidacionDto: CreateValidacionDto) {
    return 'This action adds a new validacion';
  }

  findAll() {
    return `This action returns all validacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} validacion`;
  }

  update(id: number, updateValidacionDto: UpdateValidacionDto) {
    return `This action updates a #${id} validacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} validacion`;
  }
}
