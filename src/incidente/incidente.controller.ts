// 📁 src/incidente/incidente.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe, Patch, Req } from '@nestjs/common';
import { IncidenteService } from './incidente.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('admin/incidentes')
@UseGuards(JwtAuthGuard) // 🛡️ Protegido para personal administrativo
export class IncidenteController {
  constructor(private readonly incidenteService: IncidenteService) {}

  @Get('reportes/tendencia')
  async obtenerTendenciaIncidentes(@Query('empresaId') empresaId?: string) {
    const filtro = { 
      empresaId: empresaId && empresaId !== 'todas' ? parseInt(empresaId, 10) : undefined 
    };
    return await this.incidenteService.getTendenciaIncidentes(filtro);
  }
  
  @Get('bus/:busId')
  async verHistorialDelBus(
    @Param('busId', ParseIntPipe) busId: number,
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
  ) {
    return await this.incidenteService.obtenerHistorialPorBus(busId, { tipo, estado });
  }

  @Get('bus/:busId/estadisticas')
  async verEstadisticasDelBus(@Param('busId', ParseIntPipe) busId: number) {
    return await this.incidenteService.obtenerEstadisticasPorBus(busId);
  }

  @Patch(':id/seguimiento')
  async agregarSeguimiento(
    @Param('id', ParseIntPipe) incidenteId: number,
    @Body() body: { estado?: 'pendiente' | 'en_revision' | 'resuelto'; comentario?: string },
    @Req() req: any
  ) {
    // Sacamos el nombre del administrador desde el token JWT
    const adminNombre = req.user.nombre || 'Administrador Central'; 
    
    return await this.incidenteService.actualizarSeguimiento(incidenteId, {
      estado: body.estado,
      comentario: body.comentario,
      adminNombre
    });
  }
}