import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Direccion } from './entities/direccion.entity';
import { CreateDireccionDto } from './dto/create-direccion.dto';
import { UpdateDireccionDto } from './dto/update-direccion.dto';
import { GeocodeDireccionDto } from './dto/geocode-direccion.dto';

@Injectable()
export class DireccionService {
  constructor(
    @InjectRepository(Direccion)
    private readonly direccionRepository: Repository<Direccion>,
  ) {}

  /**
   * Geocodifica una dirección completa en texto usando Nominatim OpenStreetMap
   * Ejemplo entrada: "Carrera 7 #80-25, Bogotá, Colombia"
   * @param geocodeDto Dirección en texto
   * @returns { lat, lng, direccion_normalizada }
   */
  async geocodeAddress(geocodeDto: GeocodeDireccionDto): Promise<{ lat: number; lng: number; formatted_address: string }> {
    try {
      const searchQuery = [
        geocodeDto.direccion,
        geocodeDto.ciudad || '',
        geocodeDto.pais || 'Colombia',
      ]
        .filter(Boolean)
        .join(', ');

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&timeout=10`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NestJS-Backend-App/1.0',
        },
      });

      if (!response.ok) {
        throw new InternalServerErrorException(`Error geocoding: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw new BadRequestException(`No se encontró la dirección: "${geocodeDto.direccion}"`);
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error durante geocodificación: ${error.message}`);
    }
  }

  /**
   * Crea una nueva dirección y geocodifica automáticamente
   * @param createDireccionDto DTO con campos de dirección
   * @returns Dirección creada con coordenadas
   */
  async create(createDireccionDto: CreateDireccionDto): Promise<Direccion> {
    try {
      // Construir string de dirección completa
      const direccionCompleta = [
        createDireccionDto.barrio ? `Barrio ${createDireccionDto.barrio}` : '',
        createDireccionDto.avenida ? `Avenida ${createDireccionDto.avenida}` : '',
        createDireccionDto.calle ? `Calle ${createDireccionDto.calle}` : '',
        createDireccionDto.numero,
        createDireccionDto.apartamento || '',
        createDireccionDto.manzana ? `Manzana ${createDireccionDto.manzana}` : '',
        createDireccionDto.casa ? `Casa ${createDireccionDto.casa}` : '',
        createDireccionDto.ciudad,
        createDireccionDto.codigoPostal,
      ]
        .filter(Boolean)
        .join(', ');

      // Geocodificar
      const coords = await this.geocodeAddress({
        direccion: direccionCompleta,
        ciudad: createDireccionDto.ciudad,
        pais: 'Colombia',
      });

      // Crear entity con coordenadas
      const direccion = this.direccionRepository.create({
        ...createDireccionDto,
        latitud: coords.lat,
        longitud: coords.lng,
        direccionCompleta: coords.formatted_address,
        geocodificadoEn: new Date(),
      });

      return this.direccionRepository.save(direccion);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error creando dirección: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las direcciones
   * @returns Array de direcciones
   */
  async findAll(): Promise<Direccion[]> {
    return this.direccionRepository.find({
      select: [
        'id',
        'calle',
        'numero',
        'apartamento',
        'ciudad',
        'codigoPostal',
        'latitud',
        'longitud',
        'direccionCompleta',
      ],
    });
  }

  /**
   * Obtiene una dirección por ID
   * @param id ID de la dirección
   * @returns Dirección encontrada
   */
  async findOne(id: number): Promise<Direccion> {
    const direccion = await this.direccionRepository.findOne({ where: { id } });
    if (!direccion) {
      throw new NotFoundException(`Dirección con ID ${id} no encontrada`);
    }
    return direccion;
  }

  /**
   * Actualiza una dirección y re-geocodifica si es necesario
   * @param id ID de la dirección
   * @param updateDireccionDto Datos a actualizar
   * @returns Dirección actualizada
   */
  async update(id: number, updateDireccionDto: UpdateDireccionDto): Promise<Direccion> {
    const direccion = await this.findOne(id);
    Object.assign(direccion, updateDireccionDto);

    // Si se actualizaron datos de dirección, re-geocodificar
    if (
      updateDireccionDto.calle ||
      updateDireccionDto.numero ||
      updateDireccionDto.ciudad ||
      updateDireccionDto.apartamento
    ) {
      try {
        const coords = await this.geocodeAddress({
          direccion: `${direccion.calle} ${direccion.numero}, ${direccion.ciudad}`,
          ciudad: direccion.ciudad,
          pais: 'Colombia',
        });
        direccion.latitud = coords.lat;
        direccion.longitud = coords.lng;
        direccion.direccionCompleta = coords.formatted_address;
        direccion.geocodificadoEn = new Date();
      } catch (error) {
        console.warn(`No se pudo re-geocodificar la dirección ${id}: ${error.message}`);
      }
    }

    return this.direccionRepository.save(direccion);
  }

  /**
   * Elimina una dirección
   * @param id ID de la dirección
   * @returns Mensaje de confirmación
   */
  async remove(id: number): Promise<{ message: string }> {
    const resultado = await this.direccionRepository.delete(id);
    if (resultado.affected === 0) {
      throw new NotFoundException(`Dirección con ID ${id} no encontrada`);
    }
    return { message: `Dirección con ID ${id} eliminada correctamente` };
  }
}
