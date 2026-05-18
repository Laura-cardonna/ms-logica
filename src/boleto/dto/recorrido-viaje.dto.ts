export class ValidacionRecorridoDto {
  tipo: string;
  horaExacta: Date;
  paradero: {
    id: number;
    nombre?: string; 
  };
}

export class RecorridoViajeDto {
  boletoId: number;
  ruta: {
    id: number;
    nombre: string;
  };
  operacion: {
    busPlaca: string;
    conductorNombre: string;
  };
  tiempoTotalMinutos: number;
  validaciones: ValidacionRecorridoDto[];
}