import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParaderoDto } from './dto/create-paradero.dto';
import { UpdateParaderoDto } from './dto/update-paradero.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';
import { Paradero } from './entities/paradero.entity';

@Injectable()
export class ParaderoService {
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
   * Obtiene paraderos dentro de un rango de coordenadas (para búsqueda geográfica)
   * HELPER METHOD reutilizable
   * @param latMin Latitud mínima
   * @param latMax Latitud máxima
   * @param lonMin Longitud mínima
   * @param lonMax Longitud máxima
   * @returns Array de paraderos en el rango
   */
  async findByGeographicRange(
    latMin: number,
    latMax: number,
    lonMin: number,
    lonMax: number,
  ): Promise<Paradero[]> {
    return this.paraderoRepository
      .createQueryBuilder('paradero')
      .where('paradero.latitud BETWEEN :latMin AND :latMax', { latMin, latMax })
      .andWhere('paradero.longitud BETWEEN :lonMin AND :lonMax', { lonMin, lonMax })
      .orderBy('paradero.nombre', 'ASC')
      .getMany();
  }

  /**
   * Geocodifica una dirección utilizando Nominatim de OpenStreetMap
   * @param direccion Texto de la dirección a buscar
   * @returns Coordenadas latitud y longitud
   */
  async geocodeAddress(direccion: string): Promise<{ lat: number; lng: number }> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(direccion)}&format=json&limit=1`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NestJS-Backend-App/1.0',
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
      throw new NotFoundException(`No se pudo encontrar las coordenadas para la dirección: ${direccion}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Error de geocoding: ${error.message}`);
    }
  }

  /**
   * Calcula la distancia y el tiempo a pie utilizando la API pública de OSRM
   */
  async calculateDistanceWithOSRM(lat1: number, lng1: number, lat2: number, lng2: number): Promise<{ distancia_metros: number; duracion_segundos: number } | null> {
    try {
      // OSRM requiere las coordenadas en formato longitud,latitud
      const url = `https://router.project-osrm.org/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?overview=false`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return {
          distancia_metros: data.routes[0].distance,
          duracion_segundos: data.routes[0].duration,
        };
      }
      return null;
    } catch (error) {
      console.error('Error calculando distancia con OSRM:', error);
      return null; // En caso de fallo con la API, retornamos nulo para que el código no se rompa
    }
  }

  /**
   * Busca los 5 paraderos más cercanos a unas coordenadas (o dirección geocodificada)
   * incluyendo la distancia exacta calculada por OSRM y las rutas asociadas.
   */
  async findNearby(dto: FindNearbyDto): Promise<any[]> {
    let lat = dto.lat;
    let lng = dto.lng;

    if (dto.direccion) {
      const coords = await this.geocodeAddress(dto.direccion);
      lat = coords.lat;
      lng = coords.lng;
    }

    if (lat === undefined || lng === undefined) {
       throw new Error('No se pudieron determinar las coordenadas.');
    }

    const { entities } = await this.paraderoRepository
      .createQueryBuilder('paradero')
      .leftJoinAndSelect('paradero.rutaParaderos', 'rutaParadero')
      .leftJoinAndSelect('rutaParadero.ruta', 'ruta')
      .where('ruta.estado = :estado', { estado: 'activa' }) 
      .orWhere('ruta.id IS NULL') 
      .getRawAndEntities();

    // Mapeamos de forma asíncrona para poder usar el await de OSRM
    const promesas = entities.map(async (paradero) => {
      
      // 1. Declaramos la variable al inicio para el alcance (Scope)
      let distanceData: { distancia_metros: number; duracion_segundos: number } | null = null;

      // 2. Validamos que la latitud y longitud existan antes de llamar a OSRM para evitar errores de TypeScript
      if (paradero.latitud !== undefined && paradero.longitud !== undefined) {
        distanceData = await this.calculateDistanceWithOSRM(
          lat, 
          lng, 
          +paradero.latitud, 
          +paradero.longitud
        );
      }
      
      const rutas = paradero.rutaParaderos?.map((rp) => ({
        id: rp.ruta?.id,
        nombre: rp.ruta?.nombre,
      })).filter(r => r.id !== undefined) || [];

      // Eliminar duplicados de rutas
      const uniqueRutas = Array.from(new Map(rutas.map(item => [item.id, item])).values());

      return {
        id: paradero.id,
        nombre: paradero.nombre,
        descripcion: paradero.descripcion,
        latitud: paradero.latitud,
        longitud: paradero.longitud,
        // 3. Usamos distanceData si existe, si no, devolvemos null
        distancia_metros: distanceData ? distanceData.distancia_metros : null,
        duracion_minutos: distanceData ? Math.ceil(distanceData.duracion_segundos / 60) : null,
        rutas: uniqueRutas,
      };
    });

    // Esperamos a que se resuelvan todas las llamadas a la API de OSRM
    const resultados = await Promise.all(promesas);

    // Ordenamos por distancia y devolvemos los 5 más cercanos
    return resultados
      .sort((a, b) => (a.distancia_metros || 0) - (b.distancia_metros || 0))
      .slice(0, 5);
  }
}