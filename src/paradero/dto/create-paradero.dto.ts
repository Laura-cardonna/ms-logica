import { IsString, IsNumber, IsNotEmpty, IsOptional, Min, Max, Matches } from 'class-validator';

export class CreateParaderoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitud: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitud: number;

  @IsNumber()
  @IsOptional()
  nodoId?: number;
}
