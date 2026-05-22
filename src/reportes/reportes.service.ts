import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleto } from '../boleto/entities/boleto.entity';
import * as ExcelJS from 'exceljs';

interface RangoEtarioResult {
  rangoEtario: string;
  cantidad: number;
}

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Boleto)
    private readonly boletoRepository: Repository<Boleto>,
  ) {}

  async getIngresosPorMetodoPago(meses: number = 6) {
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - meses);

    const resultados = await this.boletoRepository
      .createQueryBuilder('boleto')
      .innerJoin('boleto.metodoPagoCiudadano', 'mpc')
      .innerJoin('mpc.metodoPago', 'mp')
      .select('mp.nombre', 'metodoPago')
      .addSelect("DATE_FORMAT(boleto.inicioViaje, '%Y-%m')", 'mes')
      .addSelect('SUM(boleto.costo)', 'totalIngresos')
      .where('boleto.inicioViaje >= :fechaLimite', { fechaLimite })
      .andWhere("boleto.estado = 'completado'")
      .groupBy('mp.nombre')
      .addGroupBy("DATE_FORMAT(boleto.inicioViaje, '%Y-%m')")
      .orderBy('mes', 'ASC')
      .getRawMany();

    const evolucionMensualMap = new Map<string, any>();
    const totalesPorMetodo: Record<string, number> = {};

    resultados.forEach((row) => {
      const { mes, metodoPago, totalIngresos } = row;
      const ingreso = parseFloat(totalIngresos);
      if (!evolucionMensualMap.has(mes)) evolucionMensualMap.set(mes, { mes });
      evolucionMensualMap.get(mes)[metodoPago] = ingreso;
      totalesPorMetodo[metodoPago] = (totalesPorMetodo[metodoPago] || 0) + ingreso;
    });

    return {
      periodo: `Últimos ${meses} meses`,
      totalesPorMetodo,
      evolucionMensual: Array.from(evolucionMensualMap.values()),
    };
  }

  async getDistribucionEtaria(rutaId?: number, fechaInicio?: Date, fechaFin?: Date) {
    const actual: RangoEtarioResult[] = await this.consultarRangoEtario(rutaId, fechaInicio, fechaFin);

    let anterior: RangoEtarioResult[] = [];
    if (fechaInicio && fechaFin) {
      const diasDiferencia = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24);
      const fechaFinAnterior = new Date(fechaInicio);
      const fechaInicioAnterior = new Date(fechaInicio);
      fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - diasDiferencia);
      anterior = await this.consultarRangoEtario(rutaId, fechaInicioAnterior, fechaFinAnterior);
    }

    const totalPasajeros = actual.reduce((sum, item) => sum + Number(item.cantidad), 0);
    let segmentoPredominante = { rango: '', cantidad: 0 };

    const rangos = actual.map((item) => {
      const cantidad = Number(item.cantidad);
      const porcentaje = totalPasajeros > 0 ? parseFloat(((cantidad / totalPasajeros) * 100).toFixed(2)) : 0;

      const datoAnterior = anterior.find((a) => a.rangoEtario === item.rangoEtario);
      const cantidadAnterior = datoAnterior ? Number(datoAnterior.cantidad) : 0;
      let variacion = 0;
      if (cantidadAnterior > 0) variacion = ((cantidad - cantidadAnterior) / cantidadAnterior) * 100;

      if (cantidad > segmentoPredominante.cantidad)
        segmentoPredominante = { rango: item.rangoEtario, cantidad };

      return {
        rango: item.rangoEtario,
        cantidad,
        porcentaje,
        variacionVsMesAnterior: parseFloat(variacion.toFixed(2)),
      };
    });

    return { totalPasajeros, segmentoPredominante: segmentoPredominante.rango, rangos };
  }

  // ─── EXPORTACIONES CSV ──────────────────────────────────────────────────────

  async exportarIngresosCSV(meses: number = 6): Promise<string> {
    const data = await this.getIngresosPorMetodoPago(meses);
    const metodos = Object.keys(data.totalesPorMetodo);

    const header = ['Mes', ...metodos, 'Total Mes'].join(',');
    const rows = data.evolucionMensual.map((item) => {
      const valores = metodos.map((m) => (item[m] ?? 0).toString());
      const totalMes = metodos.reduce((s, m) => s + Number(item[m] ?? 0), 0);
      return [item.mes, ...valores, totalMes.toFixed(2)].join(',');
    });

    const totalRow = ['TOTAL', ...metodos.map((m) => data.totalesPorMetodo[m].toFixed(2)), ''].join(',');
    return [header, ...rows, totalRow].join('\n');
  }

  async exportarDemograficoCSV(rutaId?: number, fechaInicio?: Date, fechaFin?: Date): Promise<string> {
    const data = await this.getDistribucionEtaria(rutaId, fechaInicio, fechaFin);

    const header = ['Rango Etario', 'Cantidad', 'Porcentaje (%)', 'Variación vs Mes Anterior (%)'].join(',');
    const rows = data.rangos.map((r) =>
      [r.rango, r.cantidad, r.porcentaje, r.variacionVsMesAnterior].join(','),
    );
    const footer = [`Segmento Predominante: ${data.segmentoPredominante}`, '', '', ''].join(',');

    return [header, ...rows, '', footer].join('\n');
  }

  // ─── EXPORTACIONES EXCEL ─────────────────────────────────────────────────────

  async exportarIngresosExcel(meses: number = 6): Promise<Buffer> {
    const data = await this.getIngresosPorMetodoPago(meses);
    const metodos = Object.keys(data.totalesPorMetodo);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema KALA';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Ingresos por Método', {
      properties: { tabColor: { argb: 'FF8B5CF6' } },
    });

    // Título
    sheet.mergeCells('A1', `${String.fromCharCode(65 + metodos.length + 1)}1`);
    sheet.getCell('A1').value = `Reporte de Ingresos por Método de Pago — ${data.periodo}`;
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF8B5CF6' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Headers
    const headerRow = sheet.addRow(['Mes', ...metodos, 'Total Mes']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Datos
    data.evolucionMensual.forEach((item) => {
      const totalMes = metodos.reduce((s, m) => s + Number(item[m] ?? 0), 0);
      const row = sheet.addRow([item.mes, ...metodos.map((m) => Number(item[m] ?? 0)), totalMes]);
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (colNumber > 1) cell.numFmt = '"$"#,##0.00';
      });
    });

    // Fila totales
    const totalRow = sheet.addRow(['TOTAL', ...metodos.map((m) => data.totalesPorMetodo[m]), '']);
    totalRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F0FF' } };
      if (colNumber > 1) cell.numFmt = '"$"#,##0.00';
    });

    // Ancho de columnas
    sheet.columns.forEach((col) => { col.width = 18; });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportarDemograficoExcel(rutaId?: number, fechaInicio?: Date, fechaFin?: Date): Promise<Buffer> {
    const data = await this.getDistribucionEtaria(rutaId, fechaInicio, fechaFin);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema KALA';
    const sheet = workbook.addWorksheet('Distribución Etaria', {
      properties: { tabColor: { argb: 'FFEC4899' } },
    });

    // Título
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = `Distribución Etaria de Pasajeros — Segmento: ${data.segmentoPredominante}`;
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFEC4899' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    const headerRow = sheet.addRow([
      'Rango Etario', 'Cantidad Pasajeros', 'Porcentaje (%)', 'Variación vs Período Ant. (%)', 'Total Pasajeros',
    ]);
    headerRow.eachCell((cell, i) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEC4899' } };
      cell.alignment = { horizontal: 'center' };
      if (i === 5) cell.value = data.totalPasajeros;
    });

    data.rangos.forEach((r) => {
      const row = sheet.addRow([r.rango, r.cantidad, r.porcentaje, r.variacionVsMesAnterior, '']);
      row.getCell(3).numFmt = '0.00"%"';
      row.getCell(4).numFmt = '0.00"%"';
      if (r.rango === data.segmentoPredominante) {
        row.eachCell({ includeEmpty: false }, (cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F9' } };
          cell.font = { bold: true };
        });
      }
    });

    sheet.columns.forEach((col) => { col.width = 26; });
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ─── PRIVADO ─────────────────────────────────────────────────────────────────

  private async consultarRangoEtario(
    rutaId?: number,
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<RangoEtarioResult[]> {
    const qb = this.boletoRepository
      .createQueryBuilder('boleto')
      .leftJoin('boleto.ciudadano', 'ciudadano')
      .select(
        `CASE
          WHEN ciudadano.fecha_nacimiento IS NULL THEN 'Sin información'
          WHEN TIMESTAMPDIFF(YEAR, ciudadano.fecha_nacimiento, CURDATE()) <= 17 THEN 'Menores (0-17 años)'
          WHEN TIMESTAMPDIFF(YEAR, ciudadano.fecha_nacimiento, CURDATE()) BETWEEN 18 AND 25 THEN 'Jóvenes (18-25)'
          WHEN TIMESTAMPDIFF(YEAR, ciudadano.fecha_nacimiento, CURDATE()) BETWEEN 26 AND 40 THEN 'Adultos jóvenes (26-40)'
          WHEN TIMESTAMPDIFF(YEAR, ciudadano.fecha_nacimiento, CURDATE()) BETWEEN 41 AND 60 THEN 'Adultos (41-60)'
          ELSE 'Adultos mayores (60+)'
        END`,
        'rangoEtario',
      )
      .addSelect('COUNT(boleto.id)', 'cantidad');

    if (fechaInicio && fechaFin)
      qb.where('boleto.inicioViaje BETWEEN :inicio AND :fin', { inicio: fechaInicio, fin: fechaFin });
    if (rutaId) qb.andWhere('boleto.ruta_id = :rutaId', { rutaId });

    qb.groupBy('rangoEtario');
    return await qb.getRawMany();
  }
}