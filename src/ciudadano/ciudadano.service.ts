import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCiudadanoDto } from './dto/create-ciudadano.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';
import { Ciudadano } from './entities/ciudadano.entity';

@Injectable()
export class CiudadanoService {
  constructor(
    @InjectRepository(Ciudadano)
    private readonly ciudadanoRepository: Repository<Ciudadano>,
  ) {}

  create(createCiudadanoDto: CreateCiudadanoDto) {
    // Nota: Aquí podrías usar el repository para crear si lo necesitas
    return 'This action adds a new ciudadano';
  }

  findAll() {
    return this.ciudadanoRepository.find();
  }

  // Cambiado a string para soportar los IDs de tipo UUID/Varchar
  findOne(id: string) {
    return this.ciudadanoRepository.findOne({
      where: { id }
    });
  }

  // Cambiado a string
  update(id: string, updateCiudadanoDto: UpdateCiudadanoDto) {
    return this.ciudadanoRepository.update(id, updateCiudadanoDto);
  }

  // Cambiado a string
  remove(id: string) {
    return this.ciudadanoRepository.delete(id);
  }

  /**
   * Busca un ciudadano por email. Si no existe, lo crea con los datos del payload.
   * Recibe: { id, email, name, ...otrosDatos }
   * El numericId se genera automáticamente en la BD (autoincrement).
   */
  async findOrCreateByEmail(payload: any) {
    if (!payload.email) {
      throw new BadRequestException('Payload must contain email');
    }

    let ciudadano = await this.ciudadanoRepository.findOne({
      where: { email: payload.email },
    });

    if (!ciudadano) {
      if (!payload.id || !payload.name) {
        throw new BadRequestException(
          'Payload must contain id and name to create ciudadano',
        );
      }

      ciudadano = this.ciudadanoRepository.create({
        id: payload.id,
        email: payload.email,
        nombre: payload.name,
        // numericId se genera automáticamente en la BD (no se asigna aquí gracias al decorador @Generated)
      });

      ciudadano = await this.ciudadanoRepository.save(ciudadano);
    }

    return {
      mensaje: ciudadano.id ? 'Ciudadano encontrado o creado' : 'Error',
      ciudadano,
    };
  }
}