import { IsOptional, IsString, IsNumber, ValidateIf, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para búsqueda de paraderos cercanos
 * Permite 3 modos:
 * 1. Por coordenadas GPS (lat/lng)
 * 2. Por dirección completa en texto
 * 3. Por componentes de dirección (calle, número, barrio, ciudad)
 */
export class FindNearbyDto {
  // Modo 1: Coordenadas GPS
  @IsOptional()
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Type(() => Number)
  lng?: number;

  // Modo 2: Dirección completa en texto
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La dirección no puede estar vacía si se envía' })
  direccion?: string;

  // Modo 3: Componentes de dirección
  @IsOptional()
  @IsString()
  calle?: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;
}
