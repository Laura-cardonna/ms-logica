import { Expose, Type, Transform } from 'class-transformer';

export class RutaListResponseDto {
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
}

export class RutaDetailResponseDto extends RutaListResponseDto {
  @Expose()
  @Type(() => RutaParaderoDetailDto)
  rutaParaderos: RutaParaderoDetailDto[];

  @Expose()
  @Transform(({ obj }) => obj.duracionEstimada || 0)
  get tiempoEstimadoTotalMinutos(): number {
    return this.duracionEstimada || 0;
  }

  @Expose()
  @Transform(({ obj }) => {
    const minutos = obj.duracionEstimada || 0;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  })
  get tiempoEstimadoFormato(): string {
    const minutos = this.duracionEstimada || 0;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  }

  @Expose()
  @Transform(({ obj }) => obj.rutaParaderos?.length || 0)
  get totalParaderos(): number {
    return this.rutaParaderos?.length || 0;
  }
}

export class ParaderoGpsDto {
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

export class RutaParaderoDetailDto {
  @Expose()
  ordenSecuencial: number;

  @Expose()
  horaLlegadaEstimada?: string;

  @Expose()
  @Type(() => ParaderoGpsDto)
  paradero: ParaderoGpsDto;
}
