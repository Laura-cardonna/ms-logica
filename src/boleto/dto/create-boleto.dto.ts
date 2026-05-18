import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class CreateBoletoDto {
  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  bus_id?: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  metodoPagoCiudadano_id?: number;

  @ApiProperty({ example: 7 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  paraderoAbordaje_id?: number;
}