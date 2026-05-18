import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RutaParadero } from './entities/ruta_paradero.entity';

@Injectable()
export class RutaParaderoService {
  constructor(
    @InjectRepository(RutaParadero)
    private readonly rutaParaderoRepository: Repository<RutaParadero>,
  ) {}

  async findAll(): Promise<RutaParadero[]> {
    return this.rutaParaderoRepository.find({ relations: ['ruta', 'paradero'] });
  }

  async findOne(id: number): Promise<RutaParadero> {
    const rutaParadero = await this.rutaParaderoRepository.findOne({ where: { id }, relations: ['ruta', 'paradero'] });
    if (!rutaParadero) throw new NotFoundException(`Relacion con ID ${id} no encontrada`);
    return rutaParadero;
  }
}