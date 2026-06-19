import { PartialType } from '@nestjs/swagger';
import { CreateAlertaClimaDto } from './create-alerta-clima.dto';

export class UpdateAlertaClimaDto extends PartialType(CreateAlertaClimaDto) {}
