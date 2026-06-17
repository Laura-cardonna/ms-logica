import { IsEmail, IsEnum, IsArray, IsString, MaxLength, IsOptional, IsNotEmpty } from 'class-validator';

export enum PqrsType {
  PETICION = 'Petición',
  QUEJA = 'Queja',
  RECLAMO = 'Reclamo',
  SUGERENCIA = 'Sugerencia',
}

export enum PqrsCategory {
  CONDUCTOR = 'Conductor',
  BUS = 'Bus',
  RUTA = 'Ruta',
  TARJETA = 'Tarjeta',
  OTRO = 'Otro',
}

export class CreatePqrsDto {
  // CRITERIO DE ACEPTACIÓN: Obligatorio y debe cumplir con el Enum
  @IsEnum(PqrsType, { message: 'El tipo de PQRS no es válido' })
  @IsNotEmpty({ message: 'El tipo de PQRS es obligatorio' })
  type?: PqrsType;

  // CRITERIO DE ACEPTACIÓN: Obligatorio y debe cumplir con el Enum
  @IsEnum(PqrsCategory, { message: 'La categoría no es válida' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  category?: PqrsCategory;

  // CRITERIO DE ACEPTACIÓN: Obligatorio, texto y máximo 500 caracteres
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres' })
  description?: string;

  // CRITERIO DE ACEPTACIÓN: Obligatorio y formato email válido
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El email de contacto es obligatorio' })
  email?: string;

  // CRITERIO DE ACEPTACIÓN: Opcional (hasta 3 fotos procesadas en el servicio)
  @IsArray({ message: 'Las imágenes deben venir en un arreglo' })
  @IsString({ each: true, message: 'Cada imagen debe ser una cadena en Base64' })
  @IsOptional()
  images?: string[];
}