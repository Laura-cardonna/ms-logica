import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import { Persona } from './entities/persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonaService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

// 1. ASEGÚRATE de agregar 'Not' en los imports de typeorm arriba:
// import { Repository, Like, Not } from 'typeorm';

  async buscarPorNombre(nombre: string, excluirId?: string): Promise<Persona[]> {
    // Construimos las condiciones del filtro where
    const filtros: any = {
      nombre: Like(`%${nombre}%`),
    };

    // Si viene el ID del creador, lo excluimos de los resultados
    if (excluirId) {
      filtros.id = Not(excluirId);
    }

    return await this.personaRepository.find({
      where: filtros,
      take: 10, // Limitamos a 10 resultados para que la lista en el Front sea manejable
    });
  }

  create(createPersonaDto: CreatePersonaDto) {
    const nuevaPersona = this.personaRepository.create(createPersonaDto);
    return this.personaRepository.save(nuevaPersona);
  }

  findAll() {
    return this.personaRepository.find();
  }

  async findOne(id: string) { // Cambiado a string por el UUID
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