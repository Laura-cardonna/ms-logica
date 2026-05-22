import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // ─── DASHBOARDS ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Ingresos por método de pago (gráfico barras)' })
  @ApiQuery({ name: 'meses', required: false, example: 6 })
  @Get('ingresos-metodo-pago')
  async obtenerIngresosMetodoPago(@Query('meses') mesesStr?: string) {
    const meses = mesesStr ? parseInt(mesesStr, 10) : 6;
    return await this.reportesService.getIngresosPorMetodoPago(meses);
  }

  @ApiOperation({ summary: 'Distribución de pasajeros por rango etario (gráfico torta)' })
  @ApiQuery({ name: 'rutaId', required: false })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
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

  // ─── EXPORTACIONES CSV ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Exportar ingresos por método de pago → CSV' })
  @ApiQuery({ name: 'meses', required: false, example: 6 })
  @Get('exportar-ingresos-csv')
  async exportarIngresosCSV(
    @Query('meses') mesesStr: string,
    @Res() res: Response,
  ) {
    const meses = mesesStr ? parseInt(mesesStr, 10) : 6;
    const csv = await this.reportesService.exportarIngresosCSV(meses);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ingresos-metodo-pago-${meses}meses.csv"`);
    res.send('\uFEFF' + csv); // BOM para Excel en Windows
  }

  @ApiOperation({ summary: 'Exportar distribución etaria → CSV' })
  @Get('exportar-demografico-csv')
  async exportarDemograficoCSV(
    @Query('rutaId') rutaIdStr: string,
    @Query('fechaInicio') fechaInicioStr: string,
    @Query('fechaFin') fechaFinStr: string,
    @Res() res: Response,
  ) {
    const rutaId = rutaIdStr ? parseInt(rutaIdStr, 10) : undefined;
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : undefined;
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : undefined;
    const csv = await this.reportesService.exportarDemograficoCSV(rutaId, fechaInicio, fechaFin);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="distribucion-etaria.csv"');
    res.send('\uFEFF' + csv);
  }

  // ─── EXPORTACIONES EXCEL ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'Exportar ingresos por método de pago → Excel' })
  @ApiQuery({ name: 'meses', required: false, example: 6 })
  @Get('exportar-ingresos-excel')
  async exportarIngresosExcel(
    @Query('meses') mesesStr: string,
    @Res() res: Response,
  ) {
    const meses = mesesStr ? parseInt(mesesStr, 10) : 6;
    const buffer = await this.reportesService.exportarIngresosExcel(meses);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ingresos-metodo-pago-${meses}meses.xlsx"`);
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Exportar distribución etaria → Excel' })
  @Get('exportar-demografico-excel')
  async exportarDemograficoExcel(
    @Query('rutaId') rutaIdStr: string,
    @Query('fechaInicio') fechaInicioStr: string,
    @Query('fechaFin') fechaFinStr: string,
    @Res() res: Response,
  ) {
    const rutaId = rutaIdStr ? parseInt(rutaIdStr, 10) : undefined;
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : undefined;
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : undefined;
    const buffer = await this.reportesService.exportarDemograficoExcel(rutaId, fechaInicio, fechaFin);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="distribucion-etaria.xlsx"');
    res.send(buffer);
  }
}