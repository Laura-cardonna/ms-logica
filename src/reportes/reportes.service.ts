import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleto } from '../boleto/entities/boleto.entity';

// Definimos una interfaz para que TypeScript sepa qué esperar de la consulta
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

    return { periodo: `Últimos ${meses} meses`, totalesPorMetodo, evolucionMensual: Array.from(evolucionMensualMap.values()) };
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

    const distribucion = actual.map((item) => {
      const cantidad = Number(item.cantidad);
      const porcentaje = totalPasajeros > 0 ? ((cantidad / totalPasajeros) * 100).toFixed(2) : 0;
      
      const datoAnterior = anterior.find((a) => a.rangoEtario === item.rangoEtario);
      const cantidadAnterior = datoAnterior ? Number(datoAnterior.cantidad) : 0;
      let variacion = 0;
      if (cantidadAnterior > 0) variacion = ((cantidad - cantidadAnterior) / cantidadAnterior) * 100;

      if (cantidad > segmentoPredominante.cantidad) segmentoPredominante = { rango: item.rangoEtario, cantidad };

      return { rango: item.rangoEtario, cantidad, porcentaje: parseFloat(porcentaje.toString()), variacionVsMesAnterior: parseFloat(variacion.toFixed(2)) };
    });

    return { totalPasajeros, segmentoPredominante: segmentoPredominante.rango, distribucion };
  }

  private async consultarRangoEtario(rutaId?: number, fechaInicio?: Date, fechaFin?: Date): Promise<RangoEtarioResult[]> {
    const qb = this.boletoRepository.createQueryBuilder('boleto')
      .leftJoin('boleto.ciudadano', 'ciudadano')
      .select("CASE WHEN ciudadano.fecha_nacimiento IS NULL THEN 'Sin información' WHEN TIMESTAMPDIFF(YEAR, ciudadano.fecha_nacimiento, CURDATE()) <= 17 THEN 'Menores (0-17 años)' WHEN TIMESTAMPDIFF(YEAR, ciudadano.fecha_nacimiento, CURDATE()) BETWEEN 18 AND 25 THEN 'Jóvenes (18-25)' WHEN TIMESTAMPDIFF(YEAR, ciudadano.fecha_nacimiento, CURDATE()) BETWEEN 26 AND 40 THEN 'Adultos jóvenes (26-40)' WHEN TIMESTAMPDIFF(YEAR, ciudadano.fecha_nacimiento, CURDATE()) BETWEEN 41 AND 60 THEN 'Adultos (41-60)' ELSE 'Adultos mayores (60+)' END", 'rangoEtario')
      .addSelect('COUNT(boleto.id)', 'cantidad');

    if (fechaInicio && fechaFin) qb.where('boleto.inicioViaje BETWEEN :inicio AND :fin', { inicio: fechaInicio, fin: fechaFin });
    if (rutaId) qb.andWhere('boleto.ruta_id = :rutaId', { rutaId });

    qb.groupBy('rangoEtario');
    return await qb.getRawMany();
  }
}