import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUbicacionDto {
  @ApiProperty({ example: 4.7110 })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ example: -74.0721 })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({ example: 35.5 })
  @IsNumber()
  @IsOptional()
  velocidad?: number;
}