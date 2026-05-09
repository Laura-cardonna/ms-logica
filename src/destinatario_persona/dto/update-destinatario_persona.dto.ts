import { PartialType } from '@nestjs/mapped-types';
import { CreateDestinatarioPersonaDto } from './create-destinatario_persona.dto';

export class UpdateDestinatarioPersonaDto extends PartialType(CreateDestinatarioPersonaDto) {}
