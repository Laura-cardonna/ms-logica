import { IsOptional, IsString, IsNumber, ValidateIf, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class FindNearbyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La dirección no puede estar vacía si se envía' })
  direccion?: string;

  @ValidateIf((o) => !o.direccion || (o.lat !== undefined && o.lng !== undefined))
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'La latitud es requerida si no se envía dirección' })
  lat?: number;

  @ValidateIf((o) => !o.direccion || (o.lat !== undefined && o.lng !== undefined))
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'La longitud es requerida si no se envía dirección' })
  lng?: number;
}
