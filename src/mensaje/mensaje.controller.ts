import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { MensajeService } from './mensaje.service';
import { MensajeGateway } from './mensaje.gateway';

@Controller('mensajes')
export class MensajeController {
  constructor(
    private readonly mensajeService: MensajeService,
    private readonly mensajeGateway: MensajeGateway,
  ) {}

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

  // ✨ HU-3-005: lista de quién leyó un mensaje de grupo (vista emisor/admin)
  @Get(':id/lecturas')
  obtenerLecturas(@Param('id') id: number) {
    return this.mensajeService.obtenerLecturas(id);
  }

  // ✨ HU-3-005: borrado por admin (soft-delete). personaId explícito (sin guards,
  // patrón del controller). El servicio valida rol 'administrador' del grupo.
  @Delete(':id')
  async eliminarMensaje(
    @Param('id') id: number,
    @Query('personaId') personaId: string,
  ) {
    const res = await this.mensajeService.eliminarMensajeGrupo(id, personaId);
    // Refresco en vivo a la sala del grupo
    this.mensajeGateway.notificarMensajeEliminado(res.grupoId, res.mensajeId);
    return res;
  }

}