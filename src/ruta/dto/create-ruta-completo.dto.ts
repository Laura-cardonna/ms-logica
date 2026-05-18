import { IsString, IsNumber, IsOptional, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ParaderoRutaInputDto {
  @IsNumber()
  @IsNotEmpty()
  paraderoId: number;

  @IsNumber()
  @IsNotEmpty()
  ordenSecuencial: number;
}

/**
 * DTO para crear una ruta completa con paraderos
 * Cumple con HU-ENTR-2-009: Creación de nueva ruta
 */
export class CreateRutaCompletoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsNotEmpty()
  tarifa: number;

  @IsOptional()
  @IsString()
  estado?: 'activa' | 'inactiva';

  @IsNumber()
  @IsOptional()
  nodoId?: number;

  /**
   * Array de paraderos que conforman la ruta
   * Debe tener mínimo 3 paraderos sin duplicados
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParaderoRutaInputDto)
  paraderos: ParaderoRutaInputDto[];
}
