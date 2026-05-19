import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // Ajusta la ruta si es necesario

@ApiTags('reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Protegemos los reportes para que solo usuarios logueados (admins) los vean
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @ApiOperation({ summary: 'Obtener ingresos por método de pago (Gráfico de barras)' })
  @Get('ingresos-metodo-pago')
  async obtenerIngresosMetodoPago(@Query('meses') mesesStr: string) {
    const meses = mesesStr ? parseInt(mesesStr, 10) : 6;
    return await this.reportesService.getIngresosPorMetodoPago(meses);
  }

  @ApiOperation({ summary: 'Obtener distribución de pasajeros por edad (Gráfico de torta)' })
  @Get('pasajeros-rango-etario')
  async obtenerDistribucionEtaria(
    @Query('rutaId') rutaIdStr?: string,
    @Query('fechaInicio') fechaInicioStr?: string,
    @Query('fechaFin') fechaFinStr?: string,
  ) {
    const rutaId = rutaIdStr ? parseInt(rutaIdStr, 10) : undefined;
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : undefined;
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : undefined;

    return await this.reportesService.getDistribucionEtaria(rutaId, fechaInicio, fechaFin);
  }
}