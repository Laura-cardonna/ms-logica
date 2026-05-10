import { PartialType } from '@nestjs/mapped-types';
import { CreateBusDto } from './create-bus.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateBusDto extends PartialType(CreateBusDto) {
  @IsOptional()
  @IsString()
  // Esto asegura que solo acepte estados válidos
  @IsIn(['operativo', 'mantenimiento', 'fuera de servicio']) 
  estado?: string;
}