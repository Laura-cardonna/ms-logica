import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, Matches, ValidateIf } from 'class-validator';

export const CANALES = ['email', 'telegram'] as const;
export type Canal = (typeof CANALES)[number];

export class CreateAlertaClimaDto {
  // Horario habitual de viaje en formato HH:MM o HH:MM:SS.
  @ApiProperty({ example: '07:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'horaViaje debe tener formato HH:MM o HH:MM:SS',
  })
  horaViaje!: string;

  @ApiProperty({ example: 'Bogota', required: false })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiProperty({ example: 'email', enum: CANALES })
  @IsIn(CANALES)
  canal!: Canal;

  // Requerido solo si el canal es telegram (es el destino del mensaje).
  @ApiProperty({ example: '123456789', required: false })
  @ValidateIf((o) => o.canal === 'telegram')
  @IsString()
  telegramChatId?: string;
}
