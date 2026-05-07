import { Injectable } from '@nestjs/common';
import { CreateRutaParaderoDto } from './dto/create-ruta_paradero.dto';
import { UpdateRutaParaderoDto } from './dto/update-ruta_paradero.dto';

@Injectable()
export class RutaParaderoService {
  create(createRutaParaderoDto: CreateRutaParaderoDto) {
    return 'This action adds a new ruta_paradero';
  }

  findAll() {
    return `This action returns all ruta_paradero`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ruta_paradero`;
  }

  update(id: number, updateRutaParaderoDto: UpdateRutaParaderoDto) {
    return `This action updates a #${id} ruta_paradero`;
  }

  remove(id: number) {
    return `This action removes a #${id} ruta_paradero`;
  }
}
