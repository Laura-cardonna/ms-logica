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

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  // AHORA RECIBE SOLO 2 ARGUMENTOS (Igual que el controlador)
  async create(createBusDto: CreateBusDto, file?: any) {
    const { placa, modelo, anio, capacidad_sentados, capacidad_parados } =
      createBusDto;

    // 1. Validar placa
    const existing = await this.busRepository.findOne({ where: { placa } });
    if (existing) throw new ConflictException('La placa ya está registrada');

    const sentados = Number(capacidad_sentados ?? 0);
    const parados = Number(capacidad_parados ?? 0);

    // 2. Crear instancia
    const bus = this.busRepository.create({
      placa: placa?.toUpperCase(),
      modelo,
      anio: anio ? Number(anio) : undefined,
      capacidadSentados: sentados,
      capacidadParados: parados,
      capacidadMaxima: sentados + parados,
      codigoQr: Buffer.from(`${placa}|${Date.now()}`).toString('base64'),
      estado: 'operativo',
      // ASIGNACIÓN DE FOTO: Multer guarda la ruta en file.path
      fotoUrl: file ? file.path : null,
    });

    // 3. ASOCIACIÓN FORZADA A KALA
    const empresaKala = await this.empresaRepository.findOne({
      where: { nombre: 'KALA' },
    });

    if (empresaKala) {
      bus.empresa = empresaKala;
    }

    // 4. Guardar en MySQL
    return await this.busRepository.save(bus);
  }

  async findAll() {
    // Retorna todos los buses con la empresa asociada
    return this.busRepository.find({
      relations: ['empresa'],
      order: { id: 'ASC' },
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
    const newEstado = (updateBusDto as any).estado;
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

}
