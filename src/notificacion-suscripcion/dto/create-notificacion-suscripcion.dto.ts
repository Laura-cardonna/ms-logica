import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsIn } from 'class-validator';

// La anticipación está restringida a {5, 10, 15} minutos (CA de la HU).
export const MINUTOS_ANTICIPACION = [5, 10, 15] as const;

export class CreateNotificacionSuscripcionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  rutaId!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  paraderoId!: number;

  @ApiProperty({ example: 10, enum: MINUTOS_ANTICIPACION })
  @Type(() => Number)
  @IsInt()
  @IsIn(MINUTOS_ANTICIPACION)
  minutosAnticipacion!: number;
}
