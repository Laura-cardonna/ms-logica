import { PartialType } from '@nestjs/mapped-types';
import { CreateMetodoPagoDto } from './create-metodo_pago.dto';

export class UpdateMetodoPagoDto extends PartialType(CreateMetodoPagoDto) {}
