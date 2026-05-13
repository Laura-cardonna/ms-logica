import { Expose, Type } from 'class-transformer';

export class ParaderoResponseDto {
  @Expose()
  id: number;

  @Expose()
  nombre: string;

  @Expose()
  descripcion?: string;

  @Expose()
  latitud: number;

  @Expose()
  longitud: number;
}

export class RutaParaderoResponseDto {
  @Expose()
  id: number;

  @Expose()
  ordenSecuencial: number;

  @Expose()
  horaLlegadaEstimada?: string;

  @Expose()
  @Type(() => ParaderoResponseDto)
  paradero: ParaderoResponseDto;
}

export class RutaWithParaderosResponseDto {
  @Expose()
  id: number;

  @Expose()
  nombre: string;

  @Expose()
  descripcion?: string;

  @Expose()
  tarifa: number;

  @Expose()
  duracionEstimada: number;

  @Expose()
  estado: string;

  @Expose()
  @Type(() => RutaParaderoResponseDto)
  rutaParaderos: RutaParaderoResponseDto[];

  @Expose()
  get tiempoEstimadoTotal(): number {
    return this.duracionEstimada || 0;
  }

  @Expose()
  get totalParaderos(): number {
    return this.rutaParaderos?.length || 0;
  }
}
