import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO para geocodificar una dirección en texto plano
 * Ejemplo: "Carrera 7 #80-25, Barrio La Candelaria, Bogotá"
 */
export class GeocodeDireccionDto {
  @IsString()
  @IsNotEmpty({ message: 'La dirección es requerida' })
  direccion: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  pais?: string;
}
