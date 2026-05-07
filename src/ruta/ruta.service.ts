import { Injectable } from '@nestjs/common';
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

  create(createRutaDto: CreateRutaDto) {
    return 'This action adds a new ruta';
  }

  async findAll(nombre?: string) {
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

  findOne(id: number) {
    return `This action returns a #${id} ruta`;
  }

  update(id: number, updateRutaDto: UpdateRutaDto) {
    return `This action updates a #${id} ruta`;
  }

  remove(id: number) {
    return `This action removes a #${id} ruta`;
  }
}
