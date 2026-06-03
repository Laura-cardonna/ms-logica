import { IsString, IsArray, ArrayMinSize, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateGrupoDto {
    @IsString()
    @IsNotEmpty()
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsBoolean()
    @IsOptional() // Es bueno dejarlo opcional por si el front no lo envía de inmediato
    esPublico?: boolean;

    @IsString()
    @IsOptional()
    base64Imagen?: string;

    // 🚨 CORREGIDO: De @IsInt() pasamos a @IsString() por el UUID
    @IsString()
    @IsNotEmpty()
    creadorId?: string; 

    // 🚨 CORREGIDO: Cambiamos a @IsString({ each: true }) porque la lista contiene strings (UUIDs)
    @IsArray()
    @ArrayMinSize(2, { message: 'Debes agregar al menos 2 miembros adicionales' })
    @IsString({ each: true })
    miembrosIds?: string[]; 
}