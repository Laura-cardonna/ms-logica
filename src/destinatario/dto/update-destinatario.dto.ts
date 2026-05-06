import { PartialType } from '@nestjs/mapped-types';
import { CreateDestinatarioDto } from './create-destinatario.dto';

export class UpdateDestinatarioDto extends PartialType(CreateDestinatarioDto) {}
