import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateBusDto } from './dto/create-bus.dto';

import { UpdateBusDto } from './dto/update-bus.dto';

import { Bus } from './entities/bus.entity';

import { Empresa } from 'src/empresa/entities/empresa.entity';

import { Turno } from 'src/turno/entities/turno.entity';

import * as QRCode from 'qrcode';
import { ESTADOS_BUS, normalizarEstadoBus } from './dto/create-bus.dto';

const ORDEN_ESTADO: Record<(typeof ESTADOS_BUS)[number], number> = {
  operativo: 0,
  mantenimiento: 1,
  fuera_de_servicio: 2,
};

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,

    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,

    // 🚀 INYECTAMOS el repositorio de Turnos para calcular el estado en ruta en tiempo real

    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  async create(createBusDto: CreateBusDto, file?: any) {
    const { placa, modelo, anio, capacidad_sentados, capacidad_parados } =
      createBusDto;

    const existing = await this.busRepository.findOne({ where: { placa } });
    if (existing) throw new ConflictException('La placa ya está registrada');

    const sentados = Number(capacidad_sentados ?? 0);
    const parados = Number(capacidad_parados ?? 0);

    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const placaSegura = (placa || '').toUpperCase();
    const urlValidacionFront = `${backendBaseUrl}/bus/scan/${placaSegura}`;
    const estadoNormalizado =
      normalizarEstadoBus(createBusDto.estado) ?? 'operativo';
    let codigoQrBase64 = '';

    try {
      codigoQrBase64 = await QRCode.toDataURL(urlValidacionFront, {
        color: {
          dark: '#18181b',
          light: '#ffffff',
        },
        width: 300,
      });
    } catch (err) {
      console.error('Error generando QR en Kala:', err);
      codigoQrBase64 = await QRCode.toDataURL(urlValidacionFront);
    }

    const bus = this.busRepository.create({
      placa: placaSegura,
      modelo,
      anio: anio ? Number(anio) : undefined,
      capacidadSentados: sentados,
      capacidadParados: parados,
      capacidadMaxima: sentados + parados,
      codigoQr: codigoQrBase64,
      estado: estadoNormalizado,
      fotoUrl: file ? file.filename : null,
    });

    const empresaKala = await this.empresaRepository.findOne({
      where: { nombre: 'KALA' },
    });

    if (empresaKala) {
      bus.empresa = empresaKala;
    }

    return await this.busRepository.save(bus);
  }

  /**

   * Obtiene todos los buses inyectando dinámicamente si están ocupados en ruta

   * 🛡️ Alimenta de forma inteligente los selectores bloqueados del Gerente

   */

  async findAll(estado?: string) {
    // 1. Buscamos todos los buses con su empresa

    const estadoNormalizado = estado ? normalizarEstadoBus(estado) : undefined;

    if (estado && !estadoNormalizado) {
      throw new BadRequestException(
        'Estado inválido. Valores permitidos: operativo, mantenimiento, fuera_de_servicio',
      );
    }

    const buses = await this.busRepository.find({
      relations: ['empresa'],

      order: { id: 'ASC' },
    });

    // 2. Traemos todos los turnos activos en curso del sistema

    const turnosActivos = await this.turnoRepository.find({
      where: { estado: 'en_curso' },

      relations: ['bus'],
    });

    const busesFiltrados = estadoNormalizado
      ? buses.filter((bus) => bus.estado === estadoNormalizado)
      : buses;

    // 3. Mapeamos cada bus inyectándole la propiedad transitoria 'enRuta'

    return busesFiltrados
      .sort((busA, busB) => {
        const ordenA = ORDEN_ESTADO[busA.estado ?? 'operativo'];
        const ordenB = ORDEN_ESTADO[busB.estado ?? 'operativo'];

        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }

        return (busA.id ?? 0) - (busB.id ?? 0);
      })
      .map((bus) => {
        const estaOcupadoEnRuta = turnosActivos.some(
          (turno) => turno.bus && turno.bus.id === bus.id,
        );

        return {
          ...bus,

          enRuta: estaOcupadoEnRuta, // 🔴 true si está circulando por la ciudad, false si está estacionado libre
        };
      });
  }

  async findOne(id: number) {
    return this.busRepository.findOne({
      where: { id },

      relations: ['empresa'],
    });
  }

  async update(id: number, updateBusDto: UpdateBusDto) {
    const bus = await this.busRepository.findOne({ where: { id } });

    if (!bus) throw new NotFoundException('Bus no encontrado');

    // Only estado may be changed via this method

    const allowed = ['operativo', 'mantenimiento', 'fuera_de_servicio'];

    const newEstado = normalizarEstadoBus(updateBusDto.estado);

    if (newEstado === undefined) {
      throw new BadRequestException(
        'Solo se permite actualizar el campo "estado"',
      );
    }

    if (!allowed.includes(newEstado)) {
      throw new BadRequestException(
        `Estado inválido. Valores permitidos: ${allowed.join(', ')}`,
      );
    }

    (bus as any).estado = newEstado;

    return this.busRepository.save(bus as any);
  }

  // 🔍 Método de apoyo para validación por QR en tu bus.service.ts

  async obtenerPorPlaca(placa: string) {
    const bus = await this.busRepository.findOne({
      where: { placa: placa.toUpperCase() },

      relations: ['empresa'],
    });

    if (!bus) {
      throw new BadRequestException(
        'No se encontró ningún bus con la placa solicitada.',
      );
    }

    return bus;
  }

  // (no registrarEscaneo here — kept simple; controller handles scan display)
}
