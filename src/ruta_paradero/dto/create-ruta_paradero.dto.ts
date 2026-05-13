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
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'horaLlegadaEstimada debe estar en formato HH:mm',
  })
  horaLlegadaEstimada?: string;
}
