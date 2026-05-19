import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { IncidenteBusService } from './incidente_bus.service';
import { CreateIncidenteBusDto } from './dto/create-incidente_bus.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('incidentes-buses')
export class IncidenteBusController {
  constructor(private readonly incidenteBusService: IncidenteBusService) {}

  @Post('reportar')
  @UseGuards(JwtAuthGuard)
  async crearReporte(
    @Body() createDto: CreateIncidenteBusDto,
    @Req() req: any,
  ) {
    // Extraemos el ID del conductor (string) del token de autenticación
    const conductorId: string = req.user.id; 
    
    const reporte = await this.incidenteBusService.reportarIncidente(createDto, conductorId);
    
    return {
      success: true,
      message: '🚨 Reporte de incidente procesado y guardado correctamente en el sistema.',
      data: reporte,
    };
  }

  @Get('alertas/:empresaId')
  @UseGuards(JwtAuthGuard)
  async obtenerAlertas(@Param('empresaId') empresaId: string) {
    const empresaIdNum = parseInt(empresaId, 10);
    
    const alertas = await this.incidenteBusService.obtenerAlertasGerente(empresaIdNum);
    
    return {
      success: true,
      message: '📋 Alertas de incidentes graves (alto/crítico) obtenidas correctamente.',
      data: alertas,
      total: alertas.length,
    };
  }
}