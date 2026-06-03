import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';

@Controller('notificacion')
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) {}

  @Get('persona/:id')
  obtener(@Param('id') id: string) {
    return this.notificacionService.obtenerPorPersona(id);
  }

  @Get('unread-count/:id')
  contar(@Param('id') id: string) {
    return this.notificacionService.contarNoLeidas(id);
  }

  @Patch('leer/:id')
  leer(@Param('id') id: string) {
    return this.notificacionService.marcarComoLeida(id);
  }
}