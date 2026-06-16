import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
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
  obtenerHistorial(
    @Param('id') grupoId: number,
    @Query('personaId') personaId: string, // 🚨 NUEVO: Recibimos el id del usuario que consulta
  ) {
    return this.mensajeService.obtenerMensajesPorGrupo(grupoId, personaId);
  }

  // ✨ NUEVO: Exponer Historial 1 a 1 (CA-5)
  // ==========================================
  @Get('privado/:emisorId/:receptorId')
  obtenerHistorialPrivado(
    @Param('emisorId') emisorId: string,
    @Param('receptorId') receptorId: string,
  ) {
    return this.mensajeService.obtenerHistorialPrivado(emisorId, receptorId);
  }
}