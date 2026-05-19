import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateIncidenteBusDto {
  @IsEnum(['mecanico', 'accidente', 'retraso', 'otro'], {
    message:
      'El tipo de incidente debe ser mecanico, accidente, retraso u otro',
  })
  @IsNotEmpty()
  tipo?: 'mecanico' | 'accidente' | 'retraso' | 'otro';

  @IsEnum(['bajo', 'medio', 'alto', 'critico'], {
    message: 'La gravedad debe ser bajo, medio, alto o critico',
  })
  @IsNotEmpty()
  gravedad?: 'bajo' | 'medio' | 'alto' | 'critico';

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, {
    message: 'La descripción no puede superar los 1000 caracteres',
  })
  descripcion?: string;

  @IsNumber()
  @IsNotEmpty()
  latitud?: number;

  @IsNumber()
  @IsNotEmpty()
  longitud?: number;

  @IsArray()
  @IsOptional()
  base64Fotos?: string[]; // 👈 Array de strings en base64 para procesar las hasta 5 fotos fácilmente
}
