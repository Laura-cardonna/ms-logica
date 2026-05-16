import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParaderoDto } from './dto/create-paradero.dto';
import { UpdateParaderoDto } from './dto/update-paradero.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';
import { Paradero } from './entities/paradero.entity';

@Injectable()
export class ParaderoService {
  private readonly OSRM_URL = 'https://router.project-osrm.org/route/v1'; // Servicio de enrutamiento con grafos
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
  private readonly DEFAULT_RADIUS = 50000; // 50km para búsqueda inicial

  constructor(
    @InjectRepository(Paradero)
    private readonly paraderoRepository: Repository<Paradero>,
  ) {}

  /**
   * Crea un nuevo paradero
   * @param createParaderoDto Datos del paradero
   * @returns Paradero creado
   */
  async create(createParaderoDto: CreateParaderoDto): Promise<Paradero> {
    const paradero = this.paraderoRepository.create(createParaderoDto);
    return this.paraderoRepository.save(paradero);
  }

  /**
   * Obtiene todos los paraderos
   * @returns Array de paraderos
   */
  async findAll(): Promise<Paradero[]> {
    return this.paraderoRepository
      .createQueryBuilder('paradero')
      .select([
        'paradero.id',
        'paradero.nombre',
        'paradero.descripcion',
        'paradero.latitud',
        'paradero.longitud',
      ])
      .orderBy('paradero.nombre', 'ASC')
      .getMany();
  }

  /**
   * Obtiene un paradero por ID
   * @param id ID del paradero
   * @returns Paradero encontrado
   */
  async findOne(id: number): Promise<Paradero> {
    const paradero = await this.paraderoRepository
      .createQueryBuilder('paradero')
      .where('paradero.id = :id', { id })
      .getOne();

    if (!paradero) {
      throw new NotFoundException(`Paradero con ID ${id} no encontrado`);
    }

    return paradero;
  }

  /**
   * Actualiza un paradero
   * @param id ID del paradero
   * @param updateParaderoDto Datos a actualizar
   * @returns Paradero actualizado
   */
  async update(id: number, updateParaderoDto: UpdateParaderoDto): Promise<Paradero> {
    const paradero = await this.findOne(id);
    Object.assign(paradero, updateParaderoDto);
    return this.paraderoRepository.save(paradero);
  }

  /**
   * Elimina un paradero
   * @param id ID del paradero
   * @returns Mensaje de confirmación
   */
  async remove(id: number): Promise<{ message: string }> {
    const resultado = await this.paraderoRepository.delete(id);
    if (resultado.affected === 0) {
      throw new NotFoundException(`Paradero con ID ${id} no encontrado`);
    }
    return { message: `Paradero con ID ${id} eliminado correctamente` };
  }

  /**
   * Geocodifica una dirección utilizando Nominatim de OpenStreetMap
   * Soporta dirección en texto completo o componentes separados
   * @param dto Puede tener: direccion (string) O calle + numero + barrio + ciudad
   * @returns Coordenadas latitud y longitud
   */
  private async geocodeAddress(dto: FindNearbyDto): Promise<{ lat: number; lng: number }> {
    let direccionTexto: string;

    // Construir dirección desde componentes individuales o usar la proporcionada
    if (dto.calle || dto.numero || dto.barrio || dto.ciudad) {
      const partes = [];
      if (dto.calle) partes.push(dto.calle);
      if (dto.numero) partes.push(dto.numero);
      if (dto.barrio) partes.push(dto.barrio);
      if (dto.ciudad) partes.push(dto.ciudad);
      direccionTexto = partes.join(', ');
    } else if (dto.direccion) {
      direccionTexto = dto.direccion;
    } else {
      throw new Error('Se requiere dirección completa o componentes (calle, número, barrio, ciudad)');
    }

    const url = `${this.NOMINATIM_URL}/search?q=${encodeURIComponent(direccionTexto)}&format=json&limit=1`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NestJS-Bus-Backend/1.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      throw new NotFoundException(`No se pudo encontrar las coordenadas para: ${direccionTexto}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Error de geocoding: ${error.message}`);
    }
  }

  /**
   * Calcula la distancia real usando OSRM (Open Source Routing Machine)
   * Utiliza algoritmos de grafos sobre la red de calles de OpenStreetMap
   * @param lat1 Latitud origen
   * @param lng1 Longitud origen
   * @param lat2 Latitud destino
   * @param lng2 Longitud destino
   * @returns Distancia en metros y duración en segundos
   */
  async calculateDistanceWithOSRM(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): Promise<{ distancia_metros: number; duracion_segundos: number }> {
    const url = `${this.OSRM_URL}/car/${lng1},${lat1};${lng2},${lat2}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM error: ${response.status}`);
      }

      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distancia_metros: Math.round(route.distance),
          duracion_segundos: Math.round(route.duration),
        };
      }
      throw new Error('No se encontró ruta en OSRM');
    } catch (error) {
      console.error(`Error calculando distancia con OSRM: ${error.message}`);
      // Fallback a Haversine si OSRM falla
      return this.calculateDistanceHaversine(lat1, lng1, lat2, lng2);
    }
  }

  /**
   * Calcula distancia con fórmula Haversine (línea recta aproximada)
   * Se usa como fallback si OSRM no está disponible
   * @returns Distancia en metros
   */
  private calculateDistanceHaversine(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): { distancia_metros: number; duracion_segundos: number } {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia_metros = Math.round(R * c);
    
    // Estimación tosca de tiempo (4.5 km/h promedio en ciudad)
    const duracion_segundos = Math.round((distancia_metros / 4.5) * 3.6);
    
    return { distancia_metros, duracion_segundos };
  }

  /**
   * Obtiene paraderos dentro de un rango geográfico (para filtro inicial)
   * @param latitud Centro
   * @param longitud Centro
   * @param radiusKm Radio en kilómetros
   * @returns Array de paraderos
   */
  async findByGeographicRange(
    latitud: number,
    longitud: number,
    radiusKm: number = 5,
  ): Promise<Paradero[]> {
    // Cálculo aproximado de grados para el rango
    const deltaLat = radiusKm / 111; // 1 grado ≈ 111 km
    const deltaLng = radiusKm / (111 * Math.cos((latitud * Math.PI) / 180));

    return this.paraderoRepository
      .createQueryBuilder('paradero')
      .where('paradero.latitud BETWEEN :latMin AND :latMax', {
        latMin: latitud - deltaLat,
        latMax: latitud + deltaLat,
      })
      .andWhere('paradero.longitud BETWEEN :lonMin AND :lonMax', {
        lonMin: longitud - deltaLng,
        lonMax: longitud + deltaLng,
      })
      .orderBy('paradero.nombre', 'ASC')
      .getMany();
  }

  /**
   * Busca los 5 paraderos más cercanos a unas coordenadas (o dirección geocodificada)
   * Utiliza OSRM para calcular distancias reales por carreteras (algoritmo de grafos)
   * incluyendo la distancia exacta, duración y las rutas asociadas.
   *
   * @param dto FindNearbyDto con lat/lng o dirección
   * @returns Array de paraderos cercanos ordenados por distancia
   */
  async findNearby(dto: FindNearbyDto): Promise<any[]> {
    let lat = dto.lat;
    let lng = dto.lng;

    // Geocodificar si proporciona dirección
    if (dto.direccion || dto.calle || dto.numero || dto.barrio || dto.ciudad) {
      const coords = await this.geocodeAddress(dto);
      lat = coords.lat;
      lng = coords.lng;
    }

    if (lat === undefined || lng === undefined) {
      throw new Error('No se pudieron determinar las coordenadas.');
    }

    // 1. Búsqueda geográfica inicial para filtrar paraderos cercanos
    // (Para evitar calcular OSRM con todos los paraderos)
    const paraderosEnRango = await this.findByGeographicRange(lat, lng, 5); // 5 km iniciales

    if (paraderosEnRango.length === 0) {
      throw new NotFoundException('No se encontraron paraderos cercanos');
    }

    // 2. Obtener paraderos con rutas asociadas
    const paraderosConRutas = await this.paraderoRepository
      .createQueryBuilder('paradero')
      .leftJoinAndSelect('paradero.rutaParaderos', 'rutaParadero')
      .leftJoinAndSelect('rutaParadero.ruta', 'ruta')
      .where('paradero.id IN (:...ids)', { ids: paraderosEnRango.map((p) => p.id) })
      .getMany();

    // 3. Calcular distancia real con OSRM para cada paradero
    const paraderoConDistancia = await Promise.all(
      paraderosConRutas.map(async (paradero) => {
        const distanceData = await this.calculateDistanceWithOSRM(lat, lng, +paradero.latitud, +paradero.longitud);

        const rutas = paradero.rutaParaderos
          ?.map((rp) => ({
            id: rp.ruta?.id,
            nombre: rp.ruta?.nombre,
            estado: rp.ruta?.estado,
          }))
          .filter((r) => r.id !== undefined) || [];

        // Eliminar duplicados de rutas
        const uniqueRutas = Array.from(new Map(rutas.map((item) => [item.id, item])).values());

        return {
          id: paradero.id,
          nombre: paradero.nombre,
          descripcion: paradero.descripcion,
          latitud: paradero.latitud,
          longitud: paradero.longitud,
          distancia_metros: distanceData.distancia_metros,
          duracion_minutos: Math.ceil(distanceData.duracion_segundos / 60),
          metodo_calculo: 'OSRM (grafos)', // Para debug
          rutas: uniqueRutas,
        };
      }),
    );

    // 4. Ordenar por distancia y retornar los 5 más cercanos
    return paraderoConDistancia
      .sort((a, b) => a.distancia_metros - b.distancia_metros)
      .slice(0, 5);
  }
}

