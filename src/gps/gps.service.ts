import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateGpDto } from './dto/create-gp.dto';
import { UpdateGpDto } from './dto/update-gp.dto';

import { Gps } from './entities/gps.entity';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(Gps)

    private readonly gpsRepository: Repository<Gps>,
  ) {}

  // CREATE
  async create(createGpDto: CreateGpDto): Promise<Gps> {
    const gps = this.gpsRepository.create(createGpDto);

    return await this.gpsRepository.save(gps);
  }

  // FIND ALL
  async findAll(): Promise<Gps[]> {
    return await this.gpsRepository.find({
      relations: ['bus'],
    });
  }

  // FIND ONE
  async findOne(id: number): Promise<Gps> {
    const gps = await this.gpsRepository.findOne({
      where: { id },
      relations: ['bus'],
    });

    if (!gps) {
      throw new NotFoundException(
        `GPS con ID ${id} no encontrado`,
      );
    }

    return gps;
  }

  // UPDATE
  async update(
    id: number,
    updateGpDto: UpdateGpDto,
  ): Promise<Gps> {
    const gps = await this.gpsRepository.preload({
      id,
      ...updateGpDto,
    });

    if (!gps) {
      throw new NotFoundException(
        `GPS con ID ${id} no encontrado`,
      );
    }

    return await this.gpsRepository.save(gps);
  }

  // DELETE
  async remove(id: number): Promise<void> {
    const gps = await this.findOne(id);

    await this.gpsRepository.remove(gps);
  }
}