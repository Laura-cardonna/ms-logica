import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCiudadanoDto } from './dto/create-ciudadano.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';
import { Ciudadano } from './entities/ciudadano.entity';
import { Persona } from 'src/persona/entities/persona.entity'; 
@Injectable()
export class CiudadanoService {
  constructor(
    @InjectRepository(Ciudadano)
    private readonly ciudadanoRepository: Repository<Ciudadano>,
    // AGREGA ESTO:
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) { }

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

      // --- SOLUCIÓN: Asegurar que exista la Persona primero ---
      let persona = await this.personaRepository.findOne({ where: { id: payload.id } });
      
      if (!persona) {
        persona = this.personaRepository.create({
          id: payload.id,
          nombre: payload.name,
          email: payload.email,
        });
        await this.personaRepository.save(persona);
      }

      // Ahora que la persona existe en MySQL, creamos el ciudadano
      ciudadano = this.ciudadanoRepository.create({
        id: payload.id,
        email: payload.email,
        nombre: payload.name,
        persona: persona, // Vinculamos el objeto completo
      });

      ciudadano = await this.ciudadanoRepository.save(ciudadano);
    }

    return {
      mensaje: ciudadano.id ? 'Ciudadano encontrado o creado' : 'Error',
      ciudadano,
    };
  }

}