import { PartialType } from '@nestjs/mapped-types';
import { CreateProgramacionDto } from './create-programacion.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateProgramacionDto extends PartialType(CreateProgramacionDto) {
  @ApiProperty({
    example: 'programado',
    description: 'Estado: programado, en_curso, completado, cancelado',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['programado', 'en_curso', 'completado', 'cancelado'])
  estado?: string;
}
