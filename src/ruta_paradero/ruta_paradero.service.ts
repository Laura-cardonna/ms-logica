import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RutaParadero } from './entities/ruta_paradero.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';
import { CreateRutaParaderoDto } from './dto/create-ruta_paradero.dto';
import { UpdateRutaParaderoDto } from './dto/update-ruta_paradero.dto';

@Injectable()
export class RutaParaderoService {
  constructor(
    @InjectRepository(RutaParadero)
    private readonly rutaParaderoRepository: Repository<RutaParadero>,
    @InjectRepository(Ruta)
    private readonly rutaRepository: Repository<Ruta>,
    @InjectRepository(Paradero)
    private readonly paraderoRepository: Repository<Paradero>,
  ) {}

  /**
   * Crea una relación entre ruta y paradero
   * @param createRutaParaderoDto Datos de creación
   * @returns RutaParadero creado
   */
  async create(createRutaParaderoDto: CreateRutaParaderoDto): Promise<RutaParadero> {
    const { rutaId, paraderoId, ordenSecuencial, horaLlegadaEstimada } = createRutaParaderoDto;

    // Validar que existan ruta y paradero
    const ruta = await this.rutaRepository.findOne({ where: { id: rutaId } });
    if (!ruta) {
      throw new NotFoundException(`Ruta con ID ${rutaId} no encontrada`);
    }

    const paradero = await this.paraderoRepository.findOne({ where: { id: paraderoId } });
    if (!paradero) {
      throw new NotFoundException(`Paradero con ID ${paraderoId} no encontrada`);
    }

    // Validar orden secuencial único para la ruta
    const existente = await this.rutaParaderoRepository.findOne({
      where: { 
        ruta: { id: rutaId },
        ordenSecuencial,
      },
    });
    if (existente) {
      throw new BadRequestException(
        `Ya existe un paradero con orden ${ordenSecuencial} en esta ruta`,
      );
    }

    const rutaParadero = this.rutaParaderoRepository.create({
      ruta: { id: rutaId },
      paradero: { id: paraderoId },
      ordenSecuencial,
      horaLlegadaEstimada,
    });

    return this.rutaParaderoRepository.save(rutaParadero);
  }

  /**
   * Obtiene todos los RutaParadero
   * @returns Array de RutaParadero
   */
  async findAll(): Promise<RutaParadero[]> {
    return this.rutaParaderoRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.ruta', 'ruta')
      .leftJoinAndSelect('rp.paradero', 'paradero')
      .orderBy('rp.ruta.id', 'ASC')
      .addOrderBy('rp.ordenSecuencial', 'ASC')
      .getMany();
  }

  /**
   * Obtiene un RutaParadero por ID
   * @param id ID del RutaParadero
   * @returns RutaParadero
   */
  async findOne(id: number): Promise<RutaParadero> {
    const rutaParadero = await this.rutaParaderoRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.ruta', 'ruta')
      .leftJoinAndSelect('rp.paradero', 'paradero')
      .where('rp.id = :id', { id })
      .getOne();

    if (!rutaParadero) {
      throw new NotFoundException(`RutaParadero con ID ${id} no encontrado`);
    }

    return rutaParadero;
  }

  /**
   * Obtiene todos los paraderos de una ruta ordenados secuencialmente
   * MÉTODO REUTILIZABLE para consultas de rutas
   * @param rutaId ID de la ruta
   * @returns Array de RutaParadero ordenados
   */
  async findByRuta(rutaId: number): Promise<RutaParadero[]> {
    const rutaExiste = await this.rutaRepository.findOne({ where: { id: rutaId } });
    if (!rutaExiste) {
      throw new NotFoundException(`Ruta con ID ${rutaId} no encontrada`);
    }

    return this.rutaParaderoRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.paradero', 'paradero')
      .where('rp.ruta.id = :rutaId', { rutaId })
      .orderBy('rp.ordenSecuencial', 'ASC')
      .getMany();
  }

  /**
   * Actualiza un RutaParadero
   * @param id ID del RutaParadero
   * @param updateRutaParaderoDto Datos a actualizar
   * @returns RutaParadero actualizado
   */
  async update(
    id: number,
    updateRutaParaderoDto: UpdateRutaParaderoDto,
  ): Promise<RutaParadero> {
    const rutaParadero = await this.findOne(id);

    if (updateRutaParaderoDto.ordenSecuencial && rutaParadero.ruta?.id) {
      // Validar que no haya duplicado de orden
      const existente = await this.rutaParaderoRepository.findOne({
        where: { 
          ruta: { id: rutaParadero.ruta.id },
          ordenSecuencial: updateRutaParaderoDto.ordenSecuencial,
        },
      });
      if (existente && existente.id !== id) {
        throw new BadRequestException(
          `Ya existe un paradero con orden ${updateRutaParaderoDto.ordenSecuencial}`,
        );
      }
    }

    Object.assign(rutaParadero, updateRutaParaderoDto);
    return this.rutaParaderoRepository.save(rutaParadero);
  }

  /**
   * Elimina un RutaParadero
   * @param id ID del RutaParadero
   * @returns Mensaje de confirmación
   */
  async remove(id: number): Promise<{ message: string }> {
    const resultado = await this.rutaParaderoRepository.delete(id);
    if (resultado.affected === 0) {
      throw new NotFoundException(`RutaParadero con ID ${id} no encontrado`);
    }
    return { message: `RutaParadero con ID ${id} eliminado correctamente` };
  }

  /**
   * Obtiene el total de paraderos en una ruta
   * HELPER METHOD reutilizable
   * @param rutaId ID de la ruta
   * @returns Número de paraderos
   */
  async countParaderosInRuta(rutaId: number): Promise<number> {
    return this.rutaParaderoRepository
      .createQueryBuilder('rp')
      .where('rp.ruta.id = :rutaId', { rutaId })
      .getCount();
  }
}

