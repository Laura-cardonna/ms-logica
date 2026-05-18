import { PartialType } from '@nestjs/swagger';
import { CreateParaderoDto } from './create-paradero.dto';

export class UpdateParaderoDto extends PartialType(CreateParaderoDto) {}