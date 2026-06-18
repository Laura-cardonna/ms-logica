import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/turno/get-user.decorator';
import { NotificacionSuscripcionService } from './notificacion-suscripcion.service';
import { CreateNotificacionSuscripcionDto } from './dto/create-notificacion-suscripcion.dto';

@Controller('notificacion-suscripcion')
@UseGuards(JwtAuthGuard)
export class NotificacionSuscripcionController {
  constructor(
    private readonly suscripcionService: NotificacionSuscripcionService,
  ) {}

  // Crear suscripción para la persona autenticada (la persona sale del JWT, no del body).
  @Post()
  crear(
    @GetUser('id') personaId: string,
    @Body() dto: CreateNotificacionSuscripcionDto,
  ) {
    return this.suscripcionService.crear(personaId, dto);
  }

  // Listar las suscripciones de la persona autenticada.
  @Get('persona')
  listarMias(@GetUser('id') personaId: string) {
    return this.suscripcionService.listarPorPersona(personaId);
  }

  // Desactivar una suscripción.
  @Delete(':id')
  desactivar(@Param('id') id: string) {
    return this.suscripcionService.desactivar(id);
  }
}
