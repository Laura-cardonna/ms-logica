export class CreateRutaDto {
  nombre: string;

  descripcion?: string;

  tarifa: number;

  estado?: 'activa' | 'inactiva';

  duracionEstimada?: number;

  nodoId?: number;
}
