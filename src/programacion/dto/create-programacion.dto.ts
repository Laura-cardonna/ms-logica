import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsDateString,
  IsOptional,
  IsIn,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgramacionDto {
  @ApiProperty({
    example: 1,
    description: 'ID del bus a programar',
  })
  @IsInt()
  @Type(() => Number)
  busId: number;

  @ApiProperty({
    example: 1,
    description: 'ID de la ruta',
  })
  @IsInt()
  @Type(() => Number)
  rutaId: number;

  @ApiProperty({
    example: '2026-05-20',
    description: 'Fecha de la programación (formato YYYY-MM-DD)',
  })
  @IsDateString()
  fecha: string;

  @ApiProperty({
    example: '08:30:00',
    description: 'Hora de salida en formato HH:MM:SS',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'horaSalida debe estar en formato HH:MM:SS',
  })
  horaSalida: string;

  @ApiProperty({
    example: 5,
    description: 'Margen de tolerancia en minutos (ej: 5)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  margenToleranciaMinutos?: number;

  @ApiProperty({
    example: 45,
    description: 'Duración estimada del viaje en minutos',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duracionEstimadaMinutos?: number;

  @ApiProperty({
    example: 'none',
    description:
      'Tipo de recurrencia: none, lunes_viernes, fines_de_semana, diaria',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['none', 'lunes_viernes', 'fines_de_semana', 'diaria'])
  tipoRecurrencia?: string;

  @ApiProperty({
    example: 'Sin inconvenientes',
    description: 'Observaciones adicionales',
    required: false,
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
