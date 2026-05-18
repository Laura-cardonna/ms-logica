/**
 * DTO para representar un paradero en el recorrido detallado de una ruta
 */
export class ParaderoRecorridoDto {
  id: number;
  orden: number;
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  distanciaDesdeAnteriorMetros: number;
  tiempoEstimadoMinutos: number;
}

/**
 * DTO para la respuesta detallada del recorrido de una ruta
 * Similar a DetalleViajeResponseDto pero para rutas
 * Cumple con HU-ENTR-2-001: Se muestra el tiempo estimado total de recorrido
 * Cumple con HU-ENTR-2-009: Se puede visualizar la ruta en un mapa
 */
export class RutaRecorridoResponseDto {
  rutaId: number;
  nombre: string;
  descripcion?: string;
  tarifa: number;
  estado: string;
  codigo: string;

  // Array de paraderos ordenados secuencialmente
  paraderos: ParaderoRecorridoDto[];

  // Totales calculados
  distanciaTotal: number; // en metros
  tiempoTotalEstimado: number; // en minutos
  cantidadParaderos: number;
}
