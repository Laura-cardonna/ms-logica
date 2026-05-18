// src/turno/dto/create-turno.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTurnoDto {
  @ApiProperty({ description: 'Fecha de ejecución de la jornada operativa' })
  @IsNotEmpty()
  @IsDateString()
  fecha?: string;

  @ApiProperty({ description: 'Estampa de tiempo o ISO string de inicio del turno' })
  @IsNotEmpty()
  @IsString()
  horaInicio?: string;

  @ApiProperty({ description: 'Estampa de tiempo o ISO string de finalización del turno' })
  @IsNotEmpty()
  @IsString()
  horaFin?: string;

  @ApiProperty({ description: 'ID numérico incremental del bus de transporte asignado' })
  @IsNotEmpty()
  @IsNumber()
  busId?: number;

  @ApiProperty({ description: 'ID (UUID de autenticación) del conductor asignado a la jornada' })
  @IsNotEmpty()
  @IsString() // 🚀 Esto valida que sea CUALQUIER texto (letras, números, guiones)
  conductorId?: string;
}