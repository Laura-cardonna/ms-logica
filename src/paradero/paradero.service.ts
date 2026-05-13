import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParaderoDto } from './dto/create-paradero.dto';
import { UpdateParaderoDto } from './dto/update-paradero.dto';
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
}
