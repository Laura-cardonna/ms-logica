import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { Boleto } from './entities/boleto.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';

@Injectable()
export class BoletoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Boleto)
    private readonly boletoRepository: Repository<Boleto>,
    @InjectRepository(Ciudadano)
    private readonly ciudadanoRepository: Repository<Ciudadano>,
    @InjectRepository(Programacion)
    private readonly programacionRepository: Repository<Programacion>,
    @InjectRepository(MetodoPagoCiudadano)
    private readonly metodoPagoCiudadanoRepository: Repository<MetodoPagoCiudadano>,
    @InjectRepository(Paradero)
    private readonly paraderoRepository: Repository<Paradero>,
  ) {}

  private readonly boletoRelations = {
    ciudadano: true,
    programacion: {
      bus: true,
      ruta: true,
    },
    metodoPagoCiudadano: {
      ciudadano: true,
    },
    ruta: true,
  } as const;

  async create(createBoletoDto: CreateBoletoDto) {
    try {
      const ciudadano = await this.ciudadanoRepository.findOne({
        where: { id: createBoletoDto.ciudadano_id },
      });

      if (!ciudadano) {
        throw new NotFoundException('Ciudadano no encontrado');
      }

      const paraderoAbordaje = await this.paraderoRepository.findOne({
        where: { id: createBoletoDto.paraderoAbordaje_id },
      });

      if (!paraderoAbordaje) {
        throw new NotFoundException('Paradero de abordaje no encontrado');
      }

      const programacion = await this.programacionRepository.findOne({
        where: {
          estado: 'activa',
          bus: { id: createBoletoDto.bus_id },
        },
        relations: {
          bus: true,
          ruta: true,
          boletos: true,
        },
      });

      if (!programacion) {
        throw new NotFoundException('No hay programación activa para este bus');
      }

      const capacidadMaxima = Number(programacion.bus?.capacidadMaxima ?? 0);
      const boletosActivos = (programacion.boletos ?? []).filter(
        (boleto) => boleto.estado === 'activo',
      ).length;

      if (boletosActivos >= capacidadMaxima) {
        throw new ConflictException('Bus lleno. Abordaje rechazado');
      }

      const metodoPagoCiudadano = await this.metodoPagoCiudadanoRepository.findOne({
        where: { id: createBoletoDto.metodoPagoCiudadano_id },
        relations: {
          ciudadano: true,
        },
      });

      if (!metodoPagoCiudadano) {
        throw new NotFoundException('Método de pago ciudadano no encontrado');
      }

      if (metodoPagoCiudadano.ciudadano?.id !== createBoletoDto.ciudadano_id) {
        throw new ForbiddenException('Método de pago no pertenece al ciudadano');
      }

      if (metodoPagoCiudadano.estado !== 'activo') {
        throw new BadRequestException('Método de pago inactivo');
      }

      const tarifa = Number(programacion.ruta?.tarifa ?? 0);
      if (!Number.isFinite(tarifa) || tarifa <= 0) {
        throw new BadRequestException('La programación no tiene una tarifa válida');
      }

      const saldoActual = Number(metodoPagoCiudadano.saldo ?? 0);
      if (saldoActual < tarifa) {
        throw new BadRequestException(`Saldo insuficiente. Saldo actual: $${saldoActual}`);
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let boletoCreado: Boleto;
      let nuevoSaldo = saldoActual;

      try {
        nuevoSaldo = saldoActual - tarifa;
        metodoPagoCiudadano.saldo = nuevoSaldo;

        await queryRunner.manager.save(MetodoPagoCiudadano, metodoPagoCiudadano);

        const numeroBoleto = `BOL-${Date.now()}-${createBoletoDto.ciudadano_id}`;

        const boleto = queryRunner.manager.create(Boleto, {
          numeroBoleto,
          costo: tarifa,
          inicioViaje: new Date(),
          estado: 'activo',
          ciudadano,
          programacion,
          metodoPagoCiudadano,
          ruta: programacion.ruta,
        });

        boletoCreado = await queryRunner.manager.save(Boleto, boleto);

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      const boletoCreadoConRelaciones = await this.findOne(boletoCreado.id as number);

      return {
        mensaje: 'Abordaje exitoso',
        boleto: boletoCreadoConRelaciones,
        saldoRestante: nuevoSaldo,
      };
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return this.boletoRepository.find({
      relations: this.boletoRelations,
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const boleto = await this.boletoRepository.findOne({
      where: { id },
      relations: this.boletoRelations,
    });

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    return boleto;
  }

  async update(id: number, updateBoletoDto: UpdateBoletoDto) {
    const boleto = await this.boletoRepository.findOne({
      where: { id },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    if (updateBoletoDto.estado !== undefined) {
      boleto.estado = updateBoletoDto.estado;
    }

    if (updateBoletoDto.finViaje !== undefined) {
      boleto.finViaje = updateBoletoDto.finViaje;
    }

    await this.boletoRepository.save(boleto);

    return this.findOne(id);
  }

  async remove(id: number) {
    const boleto = await this.boletoRepository.findOne({
      where: { id },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query('DELETE FROM validaciones WHERE boleto_id = ?', [id]);
      await queryRunner.manager.delete(Boleto, id);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return { mensaje: 'Boleto eliminado correctamente' };
  }
}
