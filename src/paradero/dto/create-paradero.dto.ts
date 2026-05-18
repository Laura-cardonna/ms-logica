import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateParaderoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsNotEmpty()
  latitud: number;

  @IsNumber()
  @IsNotEmpty()
  longitud: number;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsNumber()
  @IsOptional()
  nodoId?: number;
}