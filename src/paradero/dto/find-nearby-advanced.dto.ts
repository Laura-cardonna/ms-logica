import { IsOptional, IsString, IsNumber, ValidateIf, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO mejorado para búsqueda de paraderos cercanos
 * Permite 3 modos:
 * 1. Por coordenadas GPS (lat/lng)
 * 2. Por dirección en texto plano
 * 3. Por componentes de dirección (calle, número, ciudad)
 */
export class FindNearbyAdvancedDto {
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
  apartamento?: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  avenida?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El rango debe ser un número' })
  @Type(() => Number)
  rangoMetros?: number; // Distancia máxima en metros (default: 5000m)

  @IsOptional()
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Type(() => Number)
  limite?: number; // Cantidad de paraderos a retornar (default: 5)
}
