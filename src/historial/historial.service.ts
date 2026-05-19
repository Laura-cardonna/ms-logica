import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHistorialDto } from './dto/create-historial.dto';
import { UpdateHistorialDto } from './dto/update-historial.dto';
import { Historial } from './entities/historial.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';

/**
 * DTO para representar un paradero en el recorrido del historial
 */
export class ParaderoRecorridoHistorialDto {
  id: number;
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  codigo?: string;
  tipoValidacion?: 'abordaje' | 'descenso'; // Tipo de validación del ciudadano en este paradero
  fechaValidacion?: Date; // Cuándo se validó
}

/**
 * DTO para la respuesta del recorrido armado a partir de validaciones
 */
export class RecorridoCiudadanoDto {
  ciudadanoId: string;
  cantidadParaderos: number;
  paraderos: ParaderoRecorridoHistorialDto[];
  cantidadValidaciones: number;
  fechaPrimeraValidacion?: Date;
  fechaUltimaValidacion?: Date;
}

@Injectable()
export class HistorialService {
  constructor(
    @InjectRepository(Historial)
    private readonly historialRepository: Repository<Historial>,
    @InjectRepository(Validacion)
    private readonly validacionRepository: Repository<Validacion>,
    @InjectRepository(Paradero)
    private readonly paraderoRepository: Repository<Paradero>,
    @InjectRepository(Boleto)
    private readonly boletoRepository: Repository<Boleto>,
    @InjectRepository(Ruta)
    private readonly rutaRepository: Repository<Ruta>,
    @InjectRepository(RutaParadero)
    private readonly rutaParaderoRepository: Repository<RutaParadero>,
  ) {}

  /**
   * HU-005: Traer la lógica del Recorrido a Historial
   * Consulta los paraderos validados por un ciudadano para armar la ruta
   * @param ciudadanoId ID del ciudadano
   * @returns Recorrido armado con los paraderos validados
   */
  async findValidatedStopsByCitizen(
    ciudadanoId: string,
  ): Promise<RecorridoCiudadanoDto> {
    // 1. Obtener todos los boletos del ciudadano
    const boletos = await this.boletoRepository.find({
      where: { ciudadano: { id: ciudadanoId } },
      relations: ['ciudadano'],
    });

    if (!boletos || boletos.length === 0) {
      throw new NotFoundException(
        `No se encontraron boletos para el ciudadano ${ciudadanoId}`,
      );
    }

    // 2. Obtener todas las validaciones asociadas a los boletos del ciudadano
    const validaciones = await this.validacionRepository.find({
      where: {
        boleto: { ciudadano: { id: ciudadanoId } },
      },
      relations: ['paradero', 'boleto'],
      order: {
        fecha: 'ASC', // Ordenar por fecha para mantener el recorrido
      },
    });

    if (!validaciones || validaciones.length === 0) {
      throw new NotFoundException(
        `No se encontraron validaciones para el ciudadano ${ciudadanoId}`,
      );
    }

    // 3. Armar el recorrido a partir de las validaciones
    return this.buildRouteFromValidations(validaciones, ciudadanoId);
  }

  /**
   * Arma el recorrido a partir de las validaciones
   * Agrupa los paraderos visitados en orden cronológico
   * @param validaciones Validaciones del ciudadano
   * @param ciudadanoId ID del ciudadano
   * @returns Recorrido estructurado
   */
  private buildRouteFromValidations(
    validaciones: Validacion[],
    ciudadanoId: string,
  ): RecorridoCiudadanoDto {
    // Map para evitar duplicados de paraderos y mantener el último tipo de validación
    const paraderoMap = new Map<number, ParaderoRecorridoHistorialDto>();

    // Procesar validaciones en orden cronológico
    for (const validacion of validaciones) {
      if (!validacion.paradero || !validacion.paradero.id) {
        continue; // Saltar si no hay paradero
      }

      const paraderoId = validacion.paradero.id;

      if (paraderoMap.has(paraderoId)) {
        // Actualizar si ya existe (para mantener el estado más reciente)
        const existing = paraderoMap.get(paraderoId);
        if (existing) {
          existing.tipoValidacion = validacion.tipo as 'abordaje' | 'descenso';
          existing.fechaValidacion = validacion.fecha;
        }
      } else {
        // Agregar nuevo paradero
        paraderoMap.set(paraderoId, {
          id: paraderoId,
          nombre: validacion.paradero.nombre || '',
          descripcion: validacion.paradero.descripcion,
          latitud: Number(validacion.paradero.latitud),
          longitud: Number(validacion.paradero.longitud),
          codigo: validacion.paradero.codigo,
          tipoValidacion: validacion.tipo as 'abordaje' | 'descenso',
          fechaValidacion: validacion.fecha,
        });
      }
    }

    // Convertir Map a Array manteniendo el orden
    const paraderos = Array.from(paraderoMap.values());

    // Obtener fechas de primera y última validación
    const fechaPrimeraValidacion = validaciones[0]?.fecha;
    const fechaUltimaValidacion =
      validaciones[validaciones.length - 1]?.fecha;

    return {
      ciudadanoId,
      cantidadParaderos: paraderos.length,
      paraderos,
      cantidadValidaciones: validaciones.length,
      fechaPrimeraValidacion,
      fechaUltimaValidacion,
    };
  }

  /**
   * Crea un nuevo registro en el historial
   * @param createHistorialDto Datos del historial
   * @returns Historial creado
   */
  async create(createHistorialDto: CreateHistorialDto): Promise<Historial> {
    const historial = this.historialRepository.create(createHistorialDto);
    return await this.historialRepository.save(historial);
  }

  /**
   * Obtiene todos los registros del historial
   * @returns Lista de historiales
   */
  async findAll(): Promise<Historial[]> {
    return await this.historialRepository.find({
      relations: ['tarjeta', 'nodo'],
      order: { fecha: 'DESC' },
    });
  }

  /**
   * Obtiene un registro específico del historial por ID
   * @param id ID del historial
   * @returns Historial encontrado
   */
  async findOne(id: number): Promise<Historial> {
    const historial = await this.historialRepository.findOne({
      where: { id },
      relations: ['tarjeta', 'nodo'],
    });

    if (!historial) {
      throw new NotFoundException(`Historial con ID ${id} no encontrado`);
    }

    return historial;
  }

  /**
   * Actualiza un registro del historial
   * @param id ID del historial
   * @param updateHistorialDto Datos a actualizar
   * @returns Historial actualizado
   */
  async update(
    id: number,
    updateHistorialDto: UpdateHistorialDto,
  ): Promise<Historial> {
    const historial = await this.findOne(id);

    Object.assign(historial, updateHistorialDto);

    return await this.historialRepository.save(historial);
  }

  /**
   * Elimina un registro del historial
   * @param id ID del historial
   */
  async remove(id: number): Promise<void> {
    const historial = await this.findOne(id);
    await this.historialRepository.remove(historial);
  }
}

