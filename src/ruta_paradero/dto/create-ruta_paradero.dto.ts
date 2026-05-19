import { IsNumber, IsNotEmpty, Min, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRutaParaderoDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  rutaId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  paraderoId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  ordenSecuencial: number;

  @IsOptional()
  @IsNumber()
  distanciaDesdeAnteriorMetros?: number;

  @IsOptional()
  @IsNumber()
  tiempoDesdeAnteriorMinutos?: number;
}
