/**
 * Utilidades y helpers reutilizables para el módulo de planificación de viajes
 * Estos métodos pueden ser usados en múltiples servicios
 */

/**
 * Convierte minutos a formato legible HH:mm
 * @param minutos Duración en minutos
 * @returns String formateado ej: "1h 30m" o "45m"
 */
export function formatearDuracion(minutos: number): string {
  if (!minutos || minutos <= 0) return '0m';
  
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas > 0) {
    return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
  }
  return `${mins}m`;
}

/**
 * Convierte string HH:mm a minutos
 * @param tiempo String en formato HH:mm
 * @returns Minutos totales
 */
export function tiempoAMinutos(tiempo: string): number {
  const [horas, minutos] = tiempo.split(':').map(Number);
  return horas * 60 + minutos;
}

/**
 * Convierte minutos a formato HH:mm
 * @param minutos Cantidad de minutos
 * @returns String en formato HH:mm
 */
export function minutosATiempo(minutos: number): string {
  const horas = Math.floor(minutos / 60).toString().padStart(2, '0');
  const mins = (minutos % 60).toString().padStart(2, '0');
  return `${horas}:${mins}`;
}

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine
 * @param lat1 Latitud del punto 1
 * @param lon1 Longitud del punto 1
 * @param lat2 Latitud del punto 2
 * @param lon2 Longitud del punto 2
 * @returns Distancia en kilómetros
 */
export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Valida si un string es una hora válida en formato HH:mm
 * @param tiempo String a validar
 * @returns true si es válido
 */
export function validarFormatoTiempo(tiempo: string): boolean {
  const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(tiempo);
}

/**
 * Valida coordenadas geográficas
 * @param latitud Latitud (-90 a 90)
 * @param longitud Longitud (-180 a 180)
 * @returns true si son válidas
 */
export function validarCoordenadas(latitud: number, longitud: number): boolean {
  return latitud >= -90 && latitud <= 90 && longitud >= -180 && longitud <= 180;
}

/**
 * Ordena paraderos por orden secuencial
 * ALGORITMO REUTILIZABLE
 * @param paraderos Array de paraderos con ordenSecuencial
 * @returns Array ordenado
 */
export function ordenarParaderos<T extends { ordenSecuencial: number }>(
  paraderos: T[],
): T[] {
  return [...paraderos].sort((a, b) => a.ordenSecuencial - b.ordenSecuencial);
}

/**
 * Filtra paraderos por rango de distancia desde un punto
 * ALGORITMO REUTILIZABLE para búsquedas geográficas
 * @param paraderos Array de paraderos con latitud/longitud
 * @param latCenter Latitud del centro
 * @param lonCenter Longitud del centro
 * @param radiusKm Radio en kilómetros
 * @returns Array de paraderos dentro del radio
 */
export function filtrarParaderosPorDistancia<
  T extends { latitud: number; longitud: number }
>(
  paraderos: T[],
  latCenter: number,
  lonCenter: number,
  radiusKm: number,
): T[] {
  return paraderos.filter((p) => {
    const distancia = calcularDistancia(latCenter, lonCenter, p.latitud, p.longitud);
    return distancia <= radiusKm;
  });
}

/**
 * Calcula el punto medio entre dos coordenadas
 * Útil para centrar mapas
 * @param lat1 Latitud inicial
 * @param lon1 Longitud inicial
 * @param lat2 Latitud final
 * @param lon2 Longitud final
 * @returns Coordenadas del punto medio
 */
export function calcularPuntoMedio(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): { latitud: number; longitud: number } {
  return {
    latitud: (lat1 + lat2) / 2,
    longitud: (lon1 + lon2) / 2,
  };
}

/**
 * Construye una respuesta estándar de error
 * PATRÓN REUTILIZABLE
 * @param codigo Código de error
 * @param mensaje Mensaje descriptivo
 * @param detalles Detalles adicionales opcionales
 * @returns Objeto de respuesta de error
 */
export function construirRespuestaError(
  codigo: string,
  mensaje: string,
  detalles?: any,
) {
  return {
    error: {
      codigo,
      mensaje,
      ...(detalles && { detalles }),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Construye una respuesta estándar de éxito
 * PATRÓN REUTILIZABLE
 * @param datos Datos a retornar
 * @param mensaje Mensaje opcional
 * @returns Objeto de respuesta exitosa
 */
export function construirRespuestaExito(datos: any, mensaje?: string) {
  return {
    exito: true,
    ...(mensaje && { mensaje }),
    datos,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Pagina un array de elementos
 * PATRÓN REUTILIZABLE para paginación
 * @param items Array de elementos
 * @param pagina Número de página (1-indexed)
 * @param tamanoPagina Elementos por página
 * @returns Objeto con items paginados y metadatos
 */
export function paginar<T>(items: T[], pagina: number, tamanoPagina: number) {
  const total = items.length;
  const totalPaginas = Math.ceil(total / tamanoPagina);
  const inicio = (pagina - 1) * tamanoPagina;
  const fin = inicio + tamanoPagina;

  return {
    items: items.slice(inicio, fin),
    paginacion: {
      paginaActual: pagina,
      tamanoPagina,
      total,
      totalPaginas,
    },
  };
}
