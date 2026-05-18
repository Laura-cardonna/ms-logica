import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conductor } from './entities/conductor.entity';
import { Turno } from '../turno/entities/turno.entity'; // 🚀 Asegúrate de que la ruta a la entidad Turno sea correcta
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';

@Injectable()
export class ConductorService {
  
  constructor(
    @InjectRepository(Conductor)
    private readonly conductorRepository: Repository<Conductor>,

    // 🚀 INYECTAMOS el repositorio de Turnos para verificar estados en tiempo real
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  async create(createConductorDto: CreateConductorDto) {
    const nuevoConductor = this.conductorRepository.create(createConductorDto);
    return await this.conductorRepository.save(nuevoConductor);
  }

  /**
   * Obtiene todos los conductores mapeando dinámicamente quién está activo en ruta
   * 🛡️ Evita asignaciones duplicadas en la vista del Gerente
   */
  async findAll() {
    // 1. Traemos la lista plana de conductores
    const conductores = await this.conductorRepository.find();

    // 2. Traemos todos los turnos que están actualmente 'en_curso' en el sistema
    const turnosActivos = await this.turnoRepository.find({
      where: { estado: 'en_curso' },
      relations: ['conductor']
    });

    // 3. Mapeamos los conductores inyectándoles la bandera que leerá Angular
    return conductores.map(conductor => {
      const tieneTurnoActivo = turnosActivos.some(
        turno => turno.conductor && turno.conductor.id === conductor.id
      );

      return {
        ...conductor,
        enTurnoActivo: tieneTurnoActivo // 🔴 true si está manejando, false si está libre
      };
    });
  }

  // 🚀 CAMBIADO: 'id' ahora es string (para soportar tu UUID) y quitamos la relación obsoleta
  async findOne(id: string) {
    const conductor = await this.conductorRepository.findOne({
      where: { id }
    });

    if (!conductor) {
      throw new NotFoundException(`No se encontró el conductor con ID: ${id}`);
    }
    return conductor;
  }

  // 🚀 CAMBIADO: 'id' ahora recibe el string/UUID
  async update(id: string, updateConductorDto: UpdateConductorDto) {
    const conductor = await this.findOne(id);
    const modificado = this.conductorRepository.merge(conductor, updateConductorDto);
    return await this.conductorRepository.save(modificado);
  }

  // 🚀 CAMBIADO: 'id' ahora recibe el string/UUID
  async remove(id: string) {
    const conductor = await this.findOne(id);
    await this.conductorRepository.remove(conductor);
    return { message: `Conductor con ID ${id} eliminado correctamente` };
  }
}