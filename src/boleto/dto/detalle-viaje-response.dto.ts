// src/boleto/dto/detalle-viaje-response.dto.ts

export class CoordenadaRutaDto {
  ordenSecuencial: number;
  latitud: number;
  longitud: number;
}

export class ParaderoValidacionDto {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
}

export class ValidacionViajeDto {
  tipo: string; // 'abordaje' | 'descenso'
  horaExacta: Date;
  paradero: ParaderoValidacionDto;
}

export class DetalleViajeResponseDto {
  boletoId: number;

  ruta: {
    nombre: string;
    coordenadasMapa: CoordenadaRutaDto[];
  };

  validaciones: ValidacionViajeDto[];

  tiempoTotalMinutos: number;

  operacion: {
    busPlaca: string;
    conductorNombre: string;
  };
}