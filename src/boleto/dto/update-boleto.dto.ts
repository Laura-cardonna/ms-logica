import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional } from 'class-validator';

class UpdateBoletoFieldsDto {
	@ApiPropertyOptional({ example: 'completado' })
	@IsOptional()
	@IsIn(['activo', 'completado', 'cancelado'])
	estado?: 'activo' | 'completado' | 'cancelado';

	@ApiPropertyOptional({ example: '2026-05-07T14:30:00.000Z' })
	@IsOptional()
	@Type(() => Date)
	@IsDate()
	finViaje?: Date;
}

export class UpdateBoletoDto extends PartialType(UpdateBoletoFieldsDto) {}