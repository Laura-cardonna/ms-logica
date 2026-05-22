import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMetodoPagoDto {
  @IsString()
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  @MaxLength(100, {
    message:
      'El nombre no puede superar 100 caracteres',
  })
  nombre!: string;

  @IsString()
  @IsNotEmpty({
    message: 'La descripción es obligatoria',
  })
  @MaxLength(255, {
    message:
      'La descripción no puede superar 255 caracteres',
  })
  descripcion!: string;
}