import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateHistorialDto {
  @IsOptional()
  @IsEnum(['transporte', 'recarga', 'penalidad', 'bono'], {
    message: 'El tipo debe ser transporte, recarga, penalidad o bono',
  })
  tipo?: string;

  @IsOptional()
  @IsNumber()
  monto?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  referenciaExterna?: string;
}
