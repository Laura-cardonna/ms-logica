import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { Ruta } from './entities/ruta.entity';

@Injectable()
export class RutaService {
  constructor(
    @InjectRepository(Ruta)
    private readonly rutaRepository: Repository<Ruta>,
  ) {}

  /**
   * Crea una nueva ruta
   * @param createRutaDto Datos de la ruta
   * @returns Ruta creada
   */
  async create(createRutaDto: CreateRutaDto): Promise<Ruta> {
    const ruta = this.rutaRepository.create(createRutaDto);
    return this.rutaRepository.save(ruta);
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
}
