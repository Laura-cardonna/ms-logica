import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Boleto } from './entities/boleto.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';
import { DetalleViajeResponseDto, CoordenadaRutaDto, ValidacionViajeDto } from './dto/detalle-viaje-response.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';

@Injectable()
export class BoletoService {
  constructor(
    @InjectRepository(Boleto)
    private readonly boletoRepository: Repository<Boleto>,
    @InjectRepository(Validacion)
    private readonly validacionRepository: Repository<Validacion>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(RutaParadero)
    private readonly rutaParaderoRepository: Repository<RutaParadero>,
  ) {}

  async create(data: any): Promise<Boleto> {
    const nuevoBoleto = this.boletoRepository.create(data);
    const resultado = await this.boletoRepository.save(nuevoBoleto);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  }

  async getBoletosByUserId(ciudadanoId: string): Promise<Boleto[]> {
    return await this.boletoRepository.createQueryBuilder('boleto')
      .leftJoinAndSelect('boleto.ruta', 'ruta')
      .leftJoinAndSelect('boleto.programacion', 'programacion')
      .leftJoinAndSelect('programacion.bus', 'bus')
      .where('boleto.ciudadanoId = :ciudadanoId', { ciudadanoId })
      .orWhere('boleto.ciudadano_id = :ciudadanoId', { ciudadanoId })
      .getMany();
  }

  async findAll(): Promise<Boleto[]> {
    return await this.boletoRepository.find({
      relations: ['ruta', 'programacion', 'programacion.bus'],
    });
  }

  async findOne(id: number): Promise<Boleto> {
    const boleto = await this.boletoRepository.findOne({
      where: { id },
      relations: ['ruta', 'programacion', 'programacion.bus'],
    });
    if (!boleto) throw new NotFoundException(`Boleto con ID ${id} no encontrado`);
    return boleto;
  }

  async update(id: number, updateBoletoDto: UpdateBoletoDto): Promise<Boleto> {
    const boleto = await this.findOne(id);
    Object.assign(boleto, updateBoletoDto);
    const resultado = await this.boletoRepository.save(boleto);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  }

  async remove(id: number): Promise<{ message: string }> {
    const resultado = await this.boletoRepository.delete(id);
    if (resultado.affected === 0) throw new NotFoundException(`Boleto con ID ${id} no encontrado`);
    return { message: `Boleto con ID ${id} eliminado correctamente` };
  }

  async obtenerRecorrido(boletoId: number): Promise<DetalleViajeResponseDto> {
    const boleto = await this.boletoRepository.findOne({
      where: { id: boletoId },
      relations: ['ruta', 'programacion', 'programacion.bus'],
    });

    if (!boleto) {
      throw new NotFoundException('El viaje especificado no existe');
    }

    let coordenadasMapa: CoordenadaRutaDto[] = [];
    if (boleto.ruta?.id) {
      const rutaParaderos = await this.rutaParaderoRepository.find({
        where: { ruta: { id: boleto.ruta.id } },
        relations: ['paradero'],
        order: { ordenSecuencial: 'ASC' },
      });

      coordenadasMapa = rutaParaderos.map((rp) => ({
        ordenSecuencial: rp.ordenSecuencial || 0,
        latitud: rp.paradero?.latitud ? Number(rp.paradero.latitud) : 0,
        longitud: rp.paradero?.longitud ? Number(rp.paradero.longitud) : 0,
      }));
    }

    const validacionesEntidades = await this.validacionRepository.find({
      where: { boleto: { id: boletoId } },
      relations: ['paradero'],
      order: { fecha: 'ASC' },
    });

    let conductorNombre = 'No asignado';
    if (boleto.programacion?.bus?.id && boleto.programacion?.fecha) {
      const turno = await this.turnoRepository.findOne({
        where: {
          bus: { id: boleto.programacion.bus.id },
          fecha: boleto.programacion.fecha,
        },
        relations: ['conductor'],
      });

      if (turno?.conductor?.nombre) {
        // Forzamos conversión a string para cumplir la firma estricta
        conductorNombre = String(turno.conductor.nombre);
      }
    }

    let tiempoTotalMinutos = 0;
    const abordaje = validacionesEntidades.find((v) => v.tipo === 'abordaje');
    const descenso = validacionesEntidades.find((v) => v.tipo === 'descenso');

    if (abordaje?.fecha && descenso?.fecha) {
      const ms = descenso.fecha.getTime() - abordaje.fecha.getTime();
      tiempoTotalMinutos = Math.round(ms / 60000);
    } else if (boleto.inicioViaje && boleto.finViaje) {
      const ms = boleto.finViaje.getTime() - boleto.inicioViaje.getTime();
      tiempoTotalMinutos = Math.round(ms / 60000);
    }

    // Mapeamos cumpliendo estrictamente con las propiedades obligatorias del DTO
    const validacionesMapeadas: ValidacionViajeDto[] = validacionesEntidades.map((val) => ({
      tipo: val.tipo || 'desconocido',
      horaExacta: val.fecha || new Date(),
      paradero: {
        id: val.paradero?.id || 0,
        nombre: String((val.paradero as any)?.nombre || 'Paradero sin nombre'),
        latitud: val.paradero?.latitud ? Number(val.paradero.latitud) : 0,
        longitud: val.paradero?.longitud ? Number(val.paradero.longitud) : 0,
      },
    }));

    return {
      boletoId: Number(boleto.id || 0),
      ruta: {
        nombre: String(boleto.ruta?.nombre || 'Ruta sin nombre'),
        coordenadasMapa,
      },
      validaciones: validacionesMapeadas,
      tiempoTotalMinutos,
      operacion: {
        busPlaca: String(boleto.programacion?.bus?.placa || 'Sin placa'),
        conductorNombre,
      },
    };
  }
}