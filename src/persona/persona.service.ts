import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './entities/persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonaService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

  // Verifica que el nombre sea "buscar"
async buscar(query: string, excluirId?: string): Promise<Persona[]> {
    const qb = this.personaRepository.createQueryBuilder('persona');
    qb.where('(persona.nombre LIKE :q OR persona.email LIKE :q)', { q: `%${query}%` });
    if (excluirId) {
        qb.andWhere('persona.id != :excluirId', { excluirId });
    }
    return await qb.take(10).getMany();
}

  create(createPersonaDto: CreatePersonaDto) {
    const nuevaPersona = this.personaRepository.create(createPersonaDto);
    return this.personaRepository.save(nuevaPersona);
  }

  findAll() {
    return this.personaRepository.find();
  }

  async findOne(id: string) {
    const persona = await this.personaRepository.findOne({ where: { id } });
    if (!persona) throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    return persona;
  }

  async update(id: string, updatePersonaDto: UpdatePersonaDto) {
    const persona = await this.findOne(id);
    this.personaRepository.merge(persona, updatePersonaDto);
    return this.personaRepository.save(persona);
  }

  async remove(id: string) {
    const persona = await this.findOne(id);
    return this.personaRepository.remove(persona);
  }
}