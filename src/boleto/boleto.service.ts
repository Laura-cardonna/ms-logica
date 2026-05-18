import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { Boleto } from './entities/boleto.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import {
  MetodoPagoCiudadano,
  TipoInstrumento,
} from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import { RecorridoViajeDto } from './dto/recorrido-viaje.dto';
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
    @InjectRepository(Validacion)
    private readonly validacionRepository: Repository<Validacion>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
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

  async create(data: {
    bus_id: number;
    paradero_id: number;
    metodo_pago_id: number;
    ciudadano_id: string; // Este es el UUID del token
  }) {
    console.log('--- Iniciando proceso de abordaje ---');

    // 1. BUSCAR CIUDADANO (DEBE EXISTIR PREVIAMENTE)
    // Ya no creamos al ciudadano aquí. Si no está, el flujo de login falló.
    const ciudadano = await this.ciudadanoRepository.findOne({
      where: { id: data.ciudadano_id },
    });

    if (!ciudadano) {
      console.error(
        `❌ Intento de abordaje fallido: Ciudadano ${data.ciudadano_id} no registrado en DB.`,
      );
      throw new UnauthorizedException(
        'Ciudadano no encontrado en el sistema local. Reinicie sesión.',
      );
    }

    // 2. ASEGURAR MÉTODO DE PAGO
    let metodoPago = await this.metodoPagoCiudadanoRepository.findOne({
      where: { id: data.metodo_pago_id },
      relations: { ciudadano: true },
    });

    if (!metodoPago) {
      console.log(
        'Método de pago no existe para este ciudadano, vinculando...',
      );
      metodoPago = await this.metodoPagoCiudadanoRepository.save(
        this.metodoPagoCiudadanoRepository.create({
          id: data.metodo_pago_id,
          tipoInstrumento: TipoInstrumento.RECARGABLE,
          identificadorInstrumento: `RECARGA-${ciudadano.id}`,
          saldo: 50000,
          estado: 'activo',
          ciudadano: ciudadano,
        }),
      );
    } else {
      // Validamos que el método de pago sea de quien dice ser
      if (metodoPago.ciudadano?.id !== ciudadano.id) {
        throw new BadRequestException(
          'Este método de pago pertenece a otro usuario',
        );
      }
    }

    // 3. VALIDACIONES DE NEGOCIO (Bus y Saldo)
    const programacion = await this.programacionRepository.findOne({
      where: { estado: 'activa', bus: { id: data.bus_id } },
      relations: { bus: true, ruta: true, boletos: true },
    });

    if (!programacion)
      throw new NotFoundException('No hay programación activa para este bus');

    const capacidad = Number(programacion.bus?.capacidadMaxima ?? 0);
    const activos = (programacion.boletos ?? []).filter(
      (b) => b.estado === 'activo',
    ).length;
    if (activos >= capacidad)
      throw new ConflictException('Bus lleno. Abordaje rechazado');

    const tarifa = Number(programacion.ruta?.tarifa ?? 0);
    const saldoActual = Number(metodoPago.saldo ?? 0);
    if (saldoActual < tarifa)
      throw new BadRequestException(`Saldo insuficiente ($${saldoActual})`);

    // 4. TRANSACCIÓN DE COBRO Y CREACIÓN
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Descontar saldo
      metodoPago.saldo = saldoActual - tarifa;
      await queryRunner.manager.save(MetodoPagoCiudadano, metodoPago);

      // Crear boleto
      const nuevoBoleto = queryRunner.manager.create(Boleto, {
        numeroBoleto: `BOL-${Date.now()}-${ciudadano.id?.toString().substring(0, 5)}`,
        costo: tarifa,
        inicioViaje: new Date(),
        estado: 'activo',
        ciudadano,
        programacion,
        metodoPagoCiudadano: metodoPago,
        ruta: programacion.ruta,
      });

      const boletoGuardado = await queryRunner.manager.save(
        Boleto,
        nuevoBoleto,
      );
      await queryRunner.commitTransaction();

      return {
        mensaje: 'Abordaje exitoso',
        boleto: await this.findOne(boletoGuardado.id as number),
        saldoRestante: metodoPago.saldo,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // --- MÉTODOS DE CONSULTA Y GESTIÓN ---

  async getBoletosByUserId(ciudadanoId: string) {
    return await this.boletoRepository.find({
      where: { ciudadano: { id: ciudadanoId } },
      relations: this.boletoRelations,
      order: { inicioViaje: 'DESC' },
    });
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
    if (!boleto) throw new NotFoundException('Boleto no encontrado');
    return boleto;
  }

  async update(id: number, updateBoletoDto: UpdateBoletoDto) {
    const boleto = await this.boletoRepository.findOne({ where: { id } });
    if (!boleto) throw new NotFoundException('Boleto no encontrado');
    if (updateBoletoDto.estado !== undefined)
      boleto.estado = updateBoletoDto.estado;
    if (updateBoletoDto.finViaje !== undefined)
      boleto.finViaje = updateBoletoDto.finViaje;
    await this.boletoRepository.save(boleto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const boleto = await this.boletoRepository.findOne({ where: { id } });
    if (!boleto) throw new NotFoundException('Boleto no encontrado');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query('DELETE FROM validaciones WHERE boleto_id = ?', [
        id,
      ]);
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
  async obtenerRecorrido(boletoId: number): Promise<RecorridoViajeDto> {
    const boleto = await this.boletoRepository.findOne({
      where: { id: boletoId },
      relations: ['ruta', 'programacion', 'programacion.bus'],
    });

    if (!boleto) throw new NotFoundException('El viaje no existe');

    const validaciones = await this.validacionRepository.find({
      where: { boleto: { id: boletoId } },
      relations: ['paradero'],
      order: { fecha: 'ASC' },
    });

    let conductorNombre = 'No asignado';
    if (boleto.programacion?.bus && boleto.programacion?.fecha) {
      const turno = await this.turnoRepository.findOne({
        where: {
          bus: { id: boleto.programacion.bus.id },
          fecha: boleto.programacion.fecha,
        },
        relations: ['conductor'],
      });
      // Verificamos que el nombre exista para evitar el error TS2322
      if (turno?.conductor?.nombre) {
        conductorNombre = turno.conductor.nombre;
      }
    }

    let tiempoTotalMinutos = 0;
    const abordaje = validaciones.find(v => v.tipo === 'abordaje');
    const descenso = validaciones.find(v => v.tipo === 'descenso');

    if (abordaje?.fecha && descenso?.fecha) {
      const ms = descenso.fecha.getTime() - abordaje.fecha.getTime();
      tiempoTotalMinutos = Math.round(ms / 60000);
    } else if (boleto.inicioViaje && boleto.finViaje) {
      const ms = boleto.finViaje.getTime() - boleto.inicioViaje.getTime();
      tiempoTotalMinutos = Math.round(ms / 60000);
    }

    return {
      boletoId: boleto.id || 0, // Fallback a 0 si es undefined
      ruta: {
        id: boleto.ruta?.id || 0, // Fallback a 0 si es undefined
        nombre: boleto.ruta?.nombre || 'Ruta sin nombre',
      },
      operacion: {
        busPlaca: boleto.programacion?.bus?.placa || 'Placa desconocida',
        conductorNombre: conductorNombre,
      },
      tiempoTotalMinutos,
      validaciones: validaciones.map(val => ({
        tipo: val.tipo || 'desconocido', // Fallback si tipo es undefined
        horaExacta: val.fecha || new Date(), // Fallback si fecha es undefined
        paradero: {
          id: val.paradero?.id || 0, // Fallback si id es undefined
          nombre: (val.paradero as any)?.nombre || 'Paradero desconocido', 
        },
      })),
    };
  }
  }

