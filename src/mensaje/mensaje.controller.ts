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

  // ✨ NUEVO: HU-ENTR-3-007 - Bandeja de entrada unificada
  // =========================================================================
  @Get('bandeja-entrada/:personaId')
  obtenerBandejaEntrada(
    @Param('personaId') personaId: string,
    @Query('tipo') tipo?: 'individual' | 'grupal',
    @Query('estado') estado?: 'leidos' | 'no_leidos',
    @Query('fecha') fecha?: string,
  ) {
    return this.mensajeService.obtenerBandejaEntrada(personaId, { tipo, estado, fecha });
  }

  // ✨ NUEVO: HU-ENTR-3-007 - Marcar como leído vía POST/PATCH explícito si se requiere
  @Post(':id/leer')
  async marcarMensajeLeido(@Param('id') id: number) {
    return this.mensajeService.marcarComoLeido(id);
  }
  
}