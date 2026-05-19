import { IsString, IsOptional, IsEmail, IsDateString } from 'class-validator';

export class CreatePersonaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;
}
