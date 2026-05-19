import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidente } from './entities/incidente.entity';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity';

@Injectable()
export class IncidenteService {
  constructor(
    @InjectRepository(Incidente)
    private readonly incidenteRepository: Repository<Incidente>,

    @InjectRepository(IncidenteBus)
    private readonly incidenteBusRepository: Repository<IncidenteBus>,
  ) {}

  /**
   * 📊 Obtiene el historial filtrado de incidentes para un bus específico
   */
  async obtenerHistorialPorBus(
    busId: number,
    filtros: { tipo?: string; estado?: string },
  ) {
    const query = this.incidenteBusRepository
      .createQueryBuilder('incidenteBus')
      .leftJoinAndSelect('incidenteBus.incidente', 'incidente')
      .leftJoinAndSelect('incidenteBus.turno', 'turno')
      .leftJoinAndSelect('turno.bus', 'bus') // 🎯 Cruzamos explícitamente hacia la entidad Bus asignada al Turno
      .leftJoinAndSelect('turno.conductor', 'conductor')
      .leftJoinAndSelect('incidenteBus.fotos', 'fotos') // 📸 Mapeo estricto de la relación de evidencias
      .where('bus.id = :busId', { busId }); // Filtramos usando la relación limpia del alias 'bus'

    if (filtros.tipo && filtros.tipo.trim() !== '') {
      query.andWhere('incidenteBus.tipo = :tipo', { tipo: filtros.tipo });
    }

    if (filtros.estado && filtros.estado.trim() !== '') {
      query.andWhere('incidente.estado = :estado', { estado: filtros.estado });
    }

    query.orderBy('incidenteBus.id', 'DESC');

    const registros = await query.getMany();
    const uploadsBaseUrl = (
      process.env.UPLOADS_BASE_URL || 'http://localhost:3000/uploads'
    ).replace(/\/$/, '');

    return registros.map((rb) => {
      // 📸 CORRECCIÓN IMÁGENES: Convertimos nombres de archivo o propiedades de objeto en URLs estáticas válidas de NestJS
      const listaFotos =
        rb.fotos && Array.isArray(rb.fotos)
          ? rb.fotos
              .map((f: any) => {
                // Evaluamos la propiedad de la imagen en base a estructuras JSON comunes (f.url, f.ruta, f.path, etc.)
                const campoUrl =
                  f.url || f.ruta || f.path || f.fotoUrl || f.nombre || '';

                if (!campoUrl) return '';

                // Si el campo ya es una URL HTTP completa, la dejamos intacta; si no, le concatenamos el prefijo estático del servidor
                return campoUrl.startsWith('http')
                  ? campoUrl
                  : `${uploadsBaseUrl}/${campoUrl}`;
              })
              .filter((url) => url !== '') // Limpiamos elementos vacíos colaterales
          : [];

      return {
        id: rb.id, // ID del incidenteBus para control del Frontend
        fecha: rb.incidente?.fecha || rb.timestamp || new Date(),
        tipo: rb.tipo,
        estado: rb.incidente?.estado || 'pendiente',
        descripcion: rb.descripcion,
        gravedad: rb.gravedad,
        conductor: rb.turno?.conductor?.nombre || 'Conductor no asignado',
        comentarios: rb.incidente?.comentarios || [],
        fotos: listaFotos, // 📸 Enviamos la lista con URLs absolutas para la directiva [src] de Angular
      };
    });
  }

  /**
   * 📈 Calcula las métricas y estadísticas requeridas para el Bus
   */
  async obtenerEstadisticasPorBus(busId: number) {
    const todos = await this.incidenteBusRepository.find({
      where: { bus: { id: busId } },
      relations: ['incidente'],
    });

    const total = todos.length;
    if (total === 0) {
      return { totalIncidentes: 0, porTipo: {}, tasaResolucion: '0%' };
    }

    const porTipo: Record<string, number> = {};
    let resueltos = 0;

    todos.forEach((item) => {
      const tipo = item.tipo || 'otro';
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;

      if (item.incidente?.estado === 'resuelto') {
        resueltos++;
      }
    });

    const tasaResolucion = `${((resueltos / total) * 100).toFixed(1)}%`;

    return {
      totalIncidentes: total,
      porTipo,
      tasaResolucion,
    };
  }

  /**
   * ✏️ Permite al Administrador cambiar el estado y agregar comentarios de seguimiento
   */
  async actualizarSeguimiento(
    id: number,
    datos: {
      estado?: 'pendiente' | 'en_revision' | 'resuelto';
      comentario?: string;
      adminNombre: string;
    },
  ) {
    const incidenteBus = await this.incidenteBusRepository.findOne({
      where: { id },
      relations: ['incidente'],
    });

    if (!incidenteBus) {
      throw new NotFoundException(
        'No se encontró el reporte técnico del bus solicitado.',
      );
    }

    let incidente = incidenteBus.incidente;

    // 🛡️ SOLUCIÓN AL ERROR DE MYSQL: Sincronizamos las columnas 'tipo' y 'descripcion' obligatorias
    if (!incidente) {
      incidente = this.incidenteRepository.create({
        tipo: incidenteBus.tipo || 'otro', // 🎯 Se hereda del reporte original
        descripcion: incidenteBus.descripcion || 'Sin descripción', // 🎯 Se hereda del reporte original
        estado: datos.estado || 'pendiente',
        fecha: new Date(),
        comentarios: [],
      });
      incidente = await this.incidenteRepository.save(incidente);

      incidenteBus.incidente = incidente;
      await this.incidenteBusRepository.save(incidenteBus);
    }

    // Actualizamos el estado si cambió en la UI
    if (datos.estado) {
      incidente.estado = datos.estado;
    }

    // Insertamos la anotación técnica en la bitácora JSON
    if (datos.comentario) {
      const nuevoComentario = {
        autor: datos.adminNombre || 'Administrador Central',
        texto: datos.comentario,
        fecha: new Date(),
      };

      const comentariosActuales = Array.isArray(incidente.comentarios)
        ? incidente.comentarios
        : [];
      incidente.comentarios = [...comentariosActuales, nuevoComentario];
    }

    return await this.incidenteRepository.save(incidente);
  }

  /**
   * 📊 HU-ENTR-2-016: Obtiene la tendencia de incidentes agrupada por mes y tipo
   * Soporta consolidado general o filtrado estricto por empresa
   */
  async getTendenciaIncidentes(filtro: { empresaId?: number }) {
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 1); // Último año calendario obligatorio

    // 🎯 Usamos incidenteBusRepository porque ahí reside el 'tipo' real reportado en el backend
    const query = this.incidenteBusRepository
      .createQueryBuilder('incidenteBus')
      .leftJoin('incidenteBus.incidente', 'incidente')
      .leftJoin('incidenteBus.bus', 'bus') // Unión hacia el bus afectado
      .select(
        "DATE_FORMAT(COALESCE(incidente.fecha, incidenteBus.timestamp, CURRENT_TIMESTAMP), '%Y-%m')",
        'mes',
      ) // Eje X agrupado por Año-Mes para MySQL
      .addSelect('incidenteBus.tipo', 'tipo') // Eje Y / Líneas diferenciadas por Tipo
      .addSelect('COUNT(incidenteBus.id)', 'cantidad')
      .where(
        '(incidente.fecha >= :fechaLimite OR incidenteBus.timestamp >= :fechaLimite)',
        { fechaLimite },
      )
      .groupBy(
        "DATE_FORMAT(COALESCE(incidente.fecha, incidenteBus.timestamp, CURRENT_TIMESTAMP), '%Y-%m')",
      )
      .addGroupBy('incidenteBus.tipo')
      .orderBy('mes', 'ASC');

    // 🏢 Si se selecciona una empresa en la UI, filtramos usando el ID de la tabla Bus
    if (filtro.empresaId) {
      query.andWhere('bus.empresaId = :empresaId', {
        empresaId: filtro.empresaId,
      });
    }

    const resultadosRaw = await query.getRawMany();

    // Saneamos la respuesta mapeando tipos de datos puros para el Frontend de Angular
    return resultadosRaw.map((row) => ({
      mes: row.mes || new Date().toISOString().substring(0, 7),
      tipo: (row.tipo || 'OTROS').toUpperCase(),
      cantidad: parseInt(row.cantidad, 10) || 0,
    }));
  }
}
