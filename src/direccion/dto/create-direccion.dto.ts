import { IsString, IsNotEmpty, IsOptional, IsNumber, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDireccionDto {
  @IsString()
  @IsNotEmpty({ message: 'La calle es requerida' })
  calle: string;

  @IsString()
  @IsNotEmpty({ message: 'El número es requerido' })
  numero: string;

  @IsOptional()
  @IsString()
  apartamento?: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  ciudad: string;

  @IsString()
  @IsNotEmpty({ message: 'El código postal es requerido' })
  @Length(5, 10, { message: 'El código postal debe tener entre 5 y 10 caracteres' })
  codigoPostal: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  avenida?: string;

  @IsOptional()
  @IsString()
  manzana?: string;

  @IsOptional()
  @IsString()
  casa?: string;
}

