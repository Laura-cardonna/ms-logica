import { PartialType } from '@nestjs/mapped-types';
import { CreateValidacionDto } from './create-validacion.dto';

export class UpdateValidacionDto extends PartialType(CreateValidacionDto) {}
