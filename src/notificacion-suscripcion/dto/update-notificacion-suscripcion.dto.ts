import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificacionSuscripcionDto } from './create-notificacion-suscripcion.dto';

export class UpdateNotificacionSuscripcionDto extends PartialType(
  CreateNotificacionSuscripcionDto,
) {}
