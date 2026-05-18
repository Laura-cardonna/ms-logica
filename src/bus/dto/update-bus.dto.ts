// update-bus.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  CreateBusDto,
  ESTADOS_BUS,
  normalizarEstadoBus,
} from './create-bus.dto';

export class UpdateBusDto extends PartialType(CreateBusDto) {
  @ApiPropertyOptional({
    example: 'operativo',
    enum: ESTADOS_BUS,
  })
  @Transform(({ value }) => normalizarEstadoBus(value))
  @IsOptional()
  @IsString()
  @IsIn(ESTADOS_BUS)
  estado?: string;
}
