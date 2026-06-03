import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MensajeService } from './mensaje.service';

@Controller('mensajes')
export class MensajeController {
  constructor(private readonly mensajeService: MensajeService) {}

  @Post('enviar-grupo')
  enviarMensaje(
    @Body() body: { emisorId: string; grupoId: number; contenido: string },
  ) {
    return this.mensajeService.enviarMensajeAGrupo(body.emisorId, body.grupoId, body.contenido);
  }

  @Get('grupo/:id')
  obtenerHistorial(@Param('id') grupoId: number) {
    return this.mensajeService.obtenerMensajesPorGrupo(grupoId);
  }
}