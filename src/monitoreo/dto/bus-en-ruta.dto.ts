export class BusEnRutaDto {
  busId: string;
  placa: string;
  latitude: number;
  longitude: number;
  velocidad: number;
  ultimaActualizacion: Date;
  paraderoMasCercano: {
    id: string;
    nombre: string;
    distanciaMetros: number;
  };
  tiempoEstimadoLlegada: number;   // minutos
  estaRetrasado: boolean;
  minutosRetraso: number;
}