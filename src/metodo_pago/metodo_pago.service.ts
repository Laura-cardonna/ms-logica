import { Injectable } from '@nestjs/common';
import { CreateMetodoPagoDto } from './dto/create-metodo_pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo_pago.dto';

@Injectable()
export class MetodoPagoService {
  create(createMetodoPagoDto: CreateMetodoPagoDto) {
    return 'This action adds a new metodoPago';
  }

  findAll() {
    return `This action returns all metodoPago`;
  }

  findOne(id: number) {
    return `This action returns a #${id} metodoPago`;
  }

  update(id: number, updateMetodoPagoDto: UpdateMetodoPagoDto) {
    return `This action updates a #${id} metodoPago`;
  }

  remove(id: number) {
    return `This action removes a #${id} metodoPago`;
  }
}
