import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import {
  RutaRecorridoResponseDto,
  ParaderoRecorridoDto,
} from './dto/ruta-recorrido-response.dto';
import { Ruta } from './entities/ruta.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';

@Injectable()
export class RutaService {
  constructor(
    @InjectRepository(Ruta)
    private readonly rutaRepository: Repository<Ruta>,
    @InjectRepository(RutaParadero)
    private readonly rutaParaderoRepository: Repository<RutaParadero>,
    @InjectRepository(Paradero)
    private readonly paraderoRepository: Repository<Paradero>,
  ) {}

  /**
   * Crea una nueva ruta
   * HU-ENTR-2-009: Creación de nueva ruta
   * @param createRutaDto Datos de la ruta (con o sin paraderos)
   * @returns Ruta creada
   */
  async create(createRutaDto: CreateRutaDto): Promise<Ruta> {
    // Generar código único para la ruta
    const codigo = this.generarCodigoRuta(createRutaDto.nombre);

    // Si se incluyen paraderos, validar y procesar
    if (createRutaDto.paraderos && createRutaDto.paraderos.length > 0) {
      // Validación 1: Mínimo 3 paraderos requeridos
      if (createRutaDto.paraderos.length < 3) {
        throw new BadRequestException(
          `La ruta debe tener mínimo 3 paraderos. Se proporcionaron ${createRutaDto.paraderos.length}`,
        );
      }

      // Validación 2: Sin paraderos duplicados
      const idsUnicos = new Set(createRutaDto.paraderos.map((p) => p.paraderoId));
      if (idsUnicos.size !== createRutaDto.paraderos.length) {
        throw new BadRequestException(
          'La ruta contiene paraderos duplicados. Cada paradero debe aparecer una sola vez.',
        );
      }

      // Validación 3: Verificar que todos los paraderos existan
      const paraderosExistentes = await this.paraderoRepository.findByIds(
        Array.from(idsUnicos),
      );
      if (paraderosExistentes.length !== idsUnicos.size) {
        throw new BadRequestException(
          'Uno o más paraderos no existen en el sistema',
        );
      }

      // Crear la ruta
      const rutaData: any = {
        nombre: createRutaDto.nombre,
        descripcion: createRutaDto.descripcion,
        tarifa: createRutaDto.tarifa,
        estado: createRutaDto.estado || 'activa',
        codigo,
      };

      const ruta = this.rutaRepository.create(rutaData);
      const rutaGuardadaRaw = await this.rutaRepository.save(ruta);
      const rutaGuardada = (Array.isArray(rutaGuardadaRaw) ? rutaGuardadaRaw[0] : rutaGuardadaRaw) as Ruta;

      // Procesar paraderos: calcular distancias y tiempos
      const paraderosOrdenados = createRutaDto.paraderos.sort(
        (a, b) => a.ordenSecuencial - b.ordenSecuencial,
      );

      let distanciaAcumulada = 0;
      let tiempoAcumulado = 0;

      for (let i = 0; i < paraderosOrdenados.length; i++) {
        const paradero = paraderosOrdenados[i];
        let distanciaDesdeAnterior = 0;
        let tiempoDesdeAnterior = 0;

        // Calcular distancia desde el paradero anterior
        if (i > 0) {
          const paraderoAnterior = paraderosExistentes.find(
            (p) => p.id === paraderosOrdenados[i - 1].paraderoId,
          );
          const paraderoActual = paraderosExistentes.find(
            (p) => p.id === paradero.paraderoId,
          );

          if (paraderoAnterior && paraderoActual) {
            // Calcular distancia usando fórmula de Haversine (distancia en línea recta aproximada)
            const distancia = this.calcularDistanciaGPS(
              paraderoAnterior.latitud as number,
              paraderoAnterior.longitud as number,
              paraderoActual.latitud as number,
              paraderoActual.longitud as number,
            );
            distanciaDesdeAnterior = Math.round(distancia);

            // Estimar tiempo: asumiendo velocidad promedio de 20 km/h en transporte urbano
            tiempoDesdeAnterior = Math.round(distanciaDesdeAnterior / 333); // 20km/h = 333m/min
          }
        }

        distanciaAcumulada += distanciaDesdeAnterior;
        tiempoAcumulado += tiempoDesdeAnterior;

        // Crear relación RutaParadero
        const paraderoItem = paraderosExistentes.find(
          (p) => p.id === paradero.paraderoId,
        );

        const rutaParaderoData: any = {
          ruta: rutaGuardada,
          paradero: paraderoItem,
          ordenSecuencial: paradero.ordenSecuencial,
          distanciaDesdeAnteriorMetros: distanciaDesdeAnterior,
          tiempoDesdeAnteriorMinutos: tiempoDesdeAnterior,
        };

        const rutaParadero = this.rutaParaderoRepository.create(
          rutaParaderoData,
        );
        await this.rutaParaderoRepository.save(rutaParadero);
      }

      // Actualizar duración estimada de la ruta
      rutaGuardada.duracionEstimada = tiempoAcumulado;
      const rutaActualizadaRaw = await this.rutaRepository.save(rutaGuardada);
      const rutaActualizada = (Array.isArray(rutaActualizadaRaw) ? rutaActualizadaRaw[0] : rutaActualizadaRaw) as Ruta;

      return rutaActualizada;
    } else {
      // Crear ruta sin paraderos
      const rutaData: any = {
        nombre: createRutaDto.nombre,
        descripcion: createRutaDto.descripcion,
        tarifa: createRutaDto.tarifa,
        estado: createRutaDto.estado || 'activa',
        duracionEstimada: createRutaDto.duracionEstimada,
        codigo,
      };

      const ruta = this.rutaRepository.create(rutaData);
      const rutaGuardadaRaw = await this.rutaRepository.save(ruta);
      const rutaGuardada = (Array.isArray(rutaGuardadaRaw) ? rutaGuardadaRaw[0] : rutaGuardadaRaw) as Ruta;
      return rutaGuardada;
    }
  }

  /**
   * Obtiene todas las rutas con filtro opcional por nombre
   * @param nombre Filtro opcional por nombre
   * @returns Array de rutas
   */
  async findAll(nombre?: string): Promise<Ruta[]> {
    const query = this.rutaRepository
      .createQueryBuilder('ruta')
      .select([
        'ruta.id',
        'ruta.nombre',
        'ruta.descripcion',
        'ruta.tarifa',
        'ruta.estado',
        'ruta.duracionEstimada',
      ]);

    if (nombre) {
      query.where('ruta.nombre LIKE :nombre', { nombre: `%${nombre}%` });
    }

    return query.orderBy('ruta.nombre', 'ASC').getMany();
  }

  /**
   * Obtiene una ruta por ID
   * @param id ID de la ruta
   * @returns Ruta encontrada
   */
  async findOne(id: number): Promise<Ruta> {
    const ruta = await this.rutaRepository
      .createQueryBuilder('ruta')
      .select([
        'ruta.id',
        'ruta.nombre',
        'ruta.descripcion',
        'ruta.tarifa',
        'ruta.estado',
        'ruta.duracionEstimada',
      ])
      .where('ruta.id = :id', { id })
      .getOne();

    if (!ruta) {
      throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
    }

    return ruta;
  }

  /**
   * Obtiene una ruta con todos sus paraderos ordenados
   * MÉTODO REUTILIZABLE para consultas detalladas
   * @param id ID de la ruta
   * @returns Ruta con paraderos completos
   */
  async findOneWithParaderos(id: number): Promise<Ruta> {
    const ruta = await this.rutaRepository
      .createQueryBuilder('ruta')
      .leftJoinAndSelect('ruta.rutaParaderos', 'rutaParadero')
      .leftJoinAndSelect('rutaParadero.paradero', 'paradero')
      .select([
        'ruta.id',
        'ruta.nombre',
        'ruta.descripcion',
        'ruta.tarifa',
        'ruta.estado',
        'ruta.duracionEstimada',
        'rutaParadero.id',
        'rutaParadero.ordenSecuencial',
        'rutaParadero.horaLlegadaEstimada',
        'paradero.id',
        'paradero.nombre',
        'paradero.descripcion',
        'paradero.latitud',
        'paradero.longitud',
      ])
      .where('ruta.id = :id', { id })
      .orderBy('rutaParadero.ordenSecuencial', 'ASC')
      .getOne();

    if (!ruta) {
      throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
    }

    // Asegurar que rutaParaderos está ordenado
    if (ruta.rutaParaderos && ruta.rutaParaderos.length > 0) {
      ruta.rutaParaderos.sort(
        (a, b) => (a.ordenSecuencial || 0) - (b.ordenSecuencial || 0),
      );
    }

    return ruta;
  }

  /**
   * Actualiza una ruta
   * @param id ID de la ruta
   * @param updateRutaDto Datos a actualizar
   * @returns Ruta actualizada
   */
  async update(id: number, updateRutaDto: UpdateRutaDto): Promise<Ruta> {
    const ruta = await this.findOne(id);
    Object.assign(ruta, updateRutaDto);
    return this.rutaRepository.save(ruta);
  }

  /**
   * Elimina una ruta
   * @param id ID de la ruta
   * @returns Mensaje de confirmación
   */
  async remove(id: number): Promise<{ message: string }> {
    const resultado = await this.rutaRepository.delete(id);
    if (resultado.affected === 0) {
      throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
    }
    return { message: `Ruta con ID ${id} eliminada correctamente` };
  }

  /**
   * Obtiene rutas activas solamente
   * HELPER METHOD reutilizable para filtros
   * @param nombre Filtro opcional por nombre
   * @returns Array de rutas activas
   */
  async findAllActivas(nombre?: string): Promise<Ruta[]> {
    const query = this.rutaRepository
      .createQueryBuilder('ruta')
      .where('ruta.estado = :estado', { estado: 'activa' })
      .select([
        'ruta.id',
        'ruta.nombre',
        'ruta.descripcion',
        'ruta.tarifa',
        'ruta.duracionEstimada',
      ]);

    if (nombre) {
      query.andWhere('ruta.nombre LIKE :nombre', { nombre: `%${nombre}%` });
    }

    return query.orderBy('ruta.nombre', 'ASC').getMany();
  }

  /**
   * MÉTODO PRIVADO: Genera código único para una ruta
   * Formato: RUT-[INICIALES]-[RANDOM]
   * Ejemplo: RUT-CEP-456789
   */
  private generarCodigoRuta(nombre: string): string {
    const iniciales = nombre
      .split(' ')
      .slice(0, 2)
      .map((palabra) => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3)
      .padEnd(3, 'R');

    const numAleatorio = Math.floor(100000 + Math.random() * 900000);
    return `RUT-${iniciales}-${numAleatorio}`;
  }

  /**
   * MÉTODO PRIVADO: Calcula distancia entre dos puntos GPS usando fórmula de Haversine
   * @param lat1 Latitud del punto 1
   * @param lon1 Longitud del punto 1
   * @param lat2 Latitud del punto 2
   * @param lon2 Longitud del punto 2
   * @returns Distancia en metros
   */
  private calcularDistanciaGPS(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en metros
  }

  /**
   * Obtiene el recorrido completo de una ruta con todos sus paraderos
   * @param id ID de la ruta
   * @returns DTO con información detallada del recorrido
   */
  async obtenerRecorrido(id: number): Promise<RutaRecorridoResponseDto> {
    const ruta = await this.findOneWithParaderos(id);

    const paraderosRecorrido: ParaderoRecorridoDto[] = (
      ruta.rutaParaderos || []
    ).map((rp) => ({
      id: rp.paradero!.id || 0,
      orden: rp.ordenSecuencial || 0,
      nombre: rp.paradero!.nombre || '',
      latitud: rp.paradero!.latitud as number,
      longitud: rp.paradero!.longitud as number,
      distanciaDesdeAnteriorMetros: rp.distanciaDesdeAnteriorMetros || 0,
      tiempoEstimadoMinutos: rp.tiempoDesdeAnteriorMinutos || 0,
    }));

    // Calcular distancia y tiempo total
    const distanciaTotal = paraderosRecorrido.reduce(
      (sum, p) => sum + (p.distanciaDesdeAnteriorMetros || 0),
      0,
    );
    const tiempoTotal = paraderosRecorrido.reduce(
      (sum, p) => sum + (p.tiempoEstimadoMinutos || 0),
      0,
    );

    return {
      rutaId: ruta.id!,
      codigo: ruta.codigo || '',
      nombre: ruta.nombre || '',
      descripcion: ruta.descripcion,
      tarifa: ruta.tarifa || 0,
      estado: ruta.estado || 'activa',
      distanciaTotal: distanciaTotal,
      tiempoTotalEstimado: tiempoTotal,
      cantidadParaderos: paraderosRecorrido.length,
      paraderos: paraderosRecorrido,
    };
  }
}
