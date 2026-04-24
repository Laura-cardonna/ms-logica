import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidenteBusDto } from './create-incidente_bus.dto';

export class UpdateIncidenteBusDto extends PartialType(CreateIncidenteBusDto) {}
