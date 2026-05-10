import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer'; // <-- Importa esto

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
  @Type(() => Number) // <-- Fuerza la conversión a número
  @IsInt()
  anio?: number;

  @ApiProperty({ example: 20 })
  @IsOptional()
  @Type(() => Number) // <-- Fuerza la conversión a número
  @IsInt()
  capacidad_sentados?: number;

  @ApiProperty({ example: 20 })
  @IsOptional()
  @Type(() => Number) // <-- Fuerza la conversión a número
  @IsInt()
  capacidad_parados?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Type(() => Number) // <-- Fuerza la conversión a número
  @IsInt()
  empresa_id?: number;

  @ApiProperty({ example: 'https://...' })
  @IsOptional()
  @IsString()
  foto_url?: string;
}