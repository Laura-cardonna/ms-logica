// create-bus.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const ESTADOS_BUS = [
  'operativo',
  'mantenimiento',
  'fuera_de_servicio',
] as const;

export function normalizarEstadoBus(
  value: unknown,
): (typeof ESTADOS_BUS)[number] | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const estado = value.trim().toLowerCase();

  if (ESTADOS_BUS.includes(estado as (typeof ESTADOS_BUS)[number])) {
    return estado as (typeof ESTADOS_BUS)[number];
  }

  if (estado === 'fuera de servicio' || estado === 'fuera-de-servicio') {
    return 'fuera_de_servicio';
  }

  return undefined;
}

export class CreateBusDto {
  @ApiProperty({ example: 'ABC-123' })
  @IsString()
  @MaxLength(20)
  placa?: string;

  @ApiProperty({ example: 'Mercedes Benz 2020' })
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiProperty({ example: 2020 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio?: number;

  @ApiProperty({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  capacidad_sentados?: number;

  @ApiProperty({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  capacidad_parados?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  empresa_id?: number;

  @ApiProperty({
    example: 'operativo',
    enum: ESTADOS_BUS,
    required: false,
  })
  @Transform(({ value }) => normalizarEstadoBus(value))
  @IsOptional()
  @IsString()
  @IsIn(ESTADOS_BUS)
  estado?: string;

  @ApiProperty({ example: 'https://...' })
  @IsOptional()
  @IsString()
  foto_url?: string;
}
