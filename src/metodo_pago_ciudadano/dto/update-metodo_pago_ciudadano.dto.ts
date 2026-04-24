import { PartialType } from '@nestjs/mapped-types';
import { CreateMetodoPagoCiudadanoDto } from './create-metodo_pago_ciudadano.dto';

export class UpdateMetodoPagoCiudadanoDto extends PartialType(CreateMetodoPagoCiudadanoDto) {}
