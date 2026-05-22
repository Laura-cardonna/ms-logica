import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class PagoDirectoDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  tarjetaId!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  monto!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipoPago!: string; // 'tarjeta' | 'daviplata'

  @ApiProperty()
  @IsString()
  @IsOptional()
  numeroTarjeta?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fechaExpiracion?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  cvv?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  franquicia?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  daviplataDocTipo?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  daviplataDocNumero?: string;
}
