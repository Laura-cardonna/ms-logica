import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { AlcanceAlerta } from '../entities/mensaje.entity';

export class CreateAlertaMasivaDto {
  @IsString()
  @IsNotEmpty()
  contenido!: string;

  @IsEnum(AlcanceAlerta)
  @IsNotEmpty()
  alcanceTipo!: AlcanceAlerta;

  @IsString()
  @IsOptional()
  alcanceId?: string;

  @IsBoolean()
  @IsOptional()
  esUrgente?: boolean;

  @IsDateString()
  @IsOptional()
  programadoPara?: string;
}