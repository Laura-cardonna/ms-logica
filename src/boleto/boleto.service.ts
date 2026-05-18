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
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity'; // 👈 Importamos la entidad Validacion para registrar los intentos de abordaje
import { FindOptionsRelations } from 'typeorm';

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
    @InjectRepository(Validacion)
    private readonly validacionRepository: Repository<Validacion>, // 👈 TU REPOSITORIO INYECTADO CORRECTAMENTE
  ) { }
  
  private readonly boletoRelations: FindOptionsRelations<Boleto> = {
    ciudadano: true,
    programacion: {
      bus: true,
      ruta: true,
    },
    metodoPagoCiudadano: {
      ciudadano: true,
    },
    ruta: {
      rutaParaderos: {
        paradero: true,
      },
    },
  };

/**
   * CREAR BOLETO (ABORDAJE) - Lógica de Negocio Premium
   */
  async create(data: {
    bus_id?: number;
    paraderoAbordaje_id?: number;
    metodoPagoCiudadano_id?: number;
    ciudadano_id?: string;
  }) {
    console.log('--- Iniciando proceso de abordaje (Validación de Saldo y Viajes Activos) ---');

    // 1. Validar existencia del Ciudadano
    const ciudadano = await this.ciudadanoRepository.findOne({
      where: { id: data.ciudadano_id },
    });

    if (!ciudadano) {
      throw new UnauthorizedException('Ciudadano no encontrado.');
    }

    // 🚨 NUEVA VALIDACIÓN: Evitar viajes simultáneos activos
    const viajeActivo = await this.boletoRepository.findOne({
      where: {
        ciudadano: { id: ciudadano.id },
        estado: 'activo',
      },
    });

    if (viajeActivo) {
      throw new ConflictException(
        `Ya tienes un viaje en curso activo (Boleto: ${viajeActivo.numeroBoleto}). Debes finalizar tu viaje actual antes de abordar otra unidad.`,
      );
    }

    // 2. Validar que la tarjeta exista y pertenezca al usuario activo
    const tarjeta = await this.metodoPagoCiudadanoRepository.findOne({
      where: { id: data.metodoPagoCiudadano_id },
      relations: { ciudadano: true },
    });

    if (!tarjeta) {
      throw new NotFoundException('La tarjeta seleccionada no existe en el sistema.');
    }

    if (tarjeta.ciudadano?.id !== ciudadano.id) {
      throw new BadRequestException(
        'Esta tarjeta pertenece a otro usuario. Utilice un instrumento de pago propio.',
      );
    }

    if (tarjeta.estado !== 'activo') {
      throw new BadRequestException('La tarjeta seleccionada se encuentra inactiva.');
    }

    // 3. Validar Programación Activa y Capacidad Máxima del Autobús
    const programacion = await this.programacionRepository.findOne({
      where: { estado: 'en_curso' as any, bus: { id: data.bus_id } },
      relations: { bus: true, ruta: true, boletos: true },
    });

    if (!programacion) {
      throw new NotFoundException(
        'No hay una programación en ruta activa para la unidad de transporte seleccionada.',
      );
    }

    const capacidad = Number(programacion.bus?.capacidadMaxima ?? 0);
    const ocupados = (programacion.boletos ?? []).filter(
      (b) => b.estado === 'activo',
    ).length;

    // 🎯 MODIFICACIÓN 1: REGISTRAR EL RECHAZO POR BUS LLENO CON TIMESTAMP Y PARADERO
    if (ocupados >= capacidad) {
      try {
        const datosValidacion: any = {
          tipo: 'abordaje',
          motivo: 'Abordaje rechazado: El bus ha alcanzado su capacidad máxima permitida.',
        };

        if (data.paraderoAbordaje_id) {
          datosValidacion.paradero = { id: data.paraderoAbordaje_id };
        }

        await this.validacionRepository.save(datosValidacion);
      } catch (auditError) {
        console.error('⚠️ Error guardando auditoría de rechazo por bus lleno:', auditError);
      }

      throw new ConflictException('Abordaje rechazado: El bus ha alcanzado su capacidad máxima permitida.');
    }

    // 4. Validar Saldo Disponible contra la Tarifa de la Ruta
    const tarifa = Number(programacion.ruta?.tarifa ?? 0);
    const saldoActual = Number(tarjeta.saldo ?? 0);

    if (saldoActual < tarifa) {
      throw new BadRequestException(
        `Saldo insuficiente para abordar. Tarifa requerida: $${tarifa}. Tu saldo disponible: $${saldoActual}`,
      );
    }

    // 5. Ejecución de Transacción Segura (Descuento de saldo y emisión de boleto)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Descontamos el saldo en el objeto en memoria
      tarjeta.saldo = saldoActual - tarifa;
      
      // 🎯 UPDATE nativo por ID directo en la BD
      await queryRunner.manager.update(
        MetodoPagoCiudadano,
        { id: tarjeta.id },
        { saldo: tarjeta.saldo }
      );

      // Clave de sufijo único para el código del boleto
      const ciudadanoIdStr = String(ciudadano.id || '0000');
      const suffix = ciudadanoIdStr.substring(0, 4).toUpperCase();

      // Instanciar registro del nuevo boleto enlazando el paradero de abordaje
      const nuevoBoleto = queryRunner.manager.create(Boleto, {
        numeroBoleto: `BOL-${Date.now()}-${suffix}`,
        costo: tarifa,
        inicioViaje: new Date(), 
        estado: 'activo',
        ciudadano: ciudadano,
        programacion: programacion,
        metodoPagoCiudadano: tarjeta,
        ruta: programacion.ruta,
        paraderoAbordaje: data.paraderoAbordaje_id ? { id: data.paraderoAbordaje_id } : null,
      } as any);

      const boletoGuardado = await queryRunner.manager.save(
        Boleto,
        nuevoBoleto,
      );

      // 🎯 MODIFICACIÓN 2: REGISTRAR LA VALIDACIÓN EXITOSA DENTRO DE LA TRANSACCIÓN
      const nuevaValidacion = queryRunner.manager.create(Validacion, {
        tipo: 'abordaje',
        motivo: 'Abordaje exitoso',
        boleto: boletoGuardado,
        paradero: data.paraderoAbordaje_id ? { id: data.paraderoAbordaje_id } : null,
      } as any);

      await queryRunner.manager.save(Validacion, nuevaValidacion);
      
      await queryRunner.commitTransaction();

      console.log(`💰 [ÉXITO] Pasaje cobrado. Nuevo saldo de la tarjeta ID ${tarjeta.id}: $${tarjeta.saldo}`);

      return {
        mensaje: 'Abordaje exitoso',
        saldoRestante: tarjeta.saldo,
        boleto: await this.findOne(boletoGuardado.id as number),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // --- MÉTODOS DE APOYO INTACTOS ---

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

    if (updateBoletoDto.estado) boleto.estado = updateBoletoDto.estado;
    if (updateBoletoDto.finViaje) boleto.finViaje = updateBoletoDto.finViaje;

    await this.boletoRepository.save(boleto);
    return this.findOne(id);
  }

  /**
   * FINALIZAR VIAJE (DESCENSO) - HU-ENTR-2-004
   * Cierra el boleto, libera cupo en el bus y audita el descenso
   */
  async finalizarViaje(data: {
    boleto_id: number;
    paraderoDescenso_id: number;
  }) {
    console.log(`--- Iniciando proceso de descenso para el Boleto ID: ${data.boleto_id} ---`);

    // 1. Validar existencia del boleto con todas sus relaciones (gracias a this.boletoRelations)
    const boleto = await this.boletoRepository.findOne({
      where: { id: data.boleto_id },
      relations: this.boletoRelations
    });

    if (!boleto) {
      throw new NotFoundException('El boleto especificado no existe.');
    }

    if (boleto.estado === 'completado') {
      throw new BadRequestException('Este viaje ya había sido completado previamente.');
    }

    // 2. Ejecutar transacción segura para el cierre del viaje
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Modificar campos del boleto en memoria
      boleto.estado = 'completado';
      boleto.finViaje = new Date(); // Registra el timestamp exacto del descenso

      // Guardamos la actualización del boleto en la BD usando el queryRunner
      const boletoActualizado = await queryRunner.manager.save(Boleto, boleto);

      // 🎯 CUMPLIMIENTO HU: Insertar el registro de descenso en la tabla 'validaciones'
      const nuevaValidacionDescenso = queryRunner.manager.create(Validacion, {
        tipo: 'descenso', // 👈 Cambia a descenso según tu ENUM
        motivo: 'Viaje completado - Gracias por usar nuestro servicio',
        boleto: boletoActualizado,
        paradero: data.paraderoDescenso_id ? { id: data.paraderoDescenso_id } : null,
      } as any);

      await queryRunner.manager.save(Validacion, nuevaValidacionDescenso);

      // Consolidamos los cambios en la Base de Datos
      await queryRunner.commitTransaction();

      console.log(`🚌 [DESCENSO] Viaje ID ${boleto.id} cerrado con éxito. Cupo liberado.`);

      return {
        mensaje: 'Viaje completado - Gracias por usar nuestro servicio',
        boleto: await this.findOne(boletoActualizado.id as number)
      };

    } catch (error) {
      // Si algo falla, se deshace todo para evitar datos corruptos
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberamos el query runner
      await queryRunner.release();
    }
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
      return { mensaje: 'Boleto eliminado correctamente' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todos los métodos de pago (tarjetas) activos de un ciudadano específico
   */
  async getTarjetasByUserId(ciudadanoId: string) {
    const ciudadano = await this.ciudadanoRepository.findOne({
      where: { id: ciudadanoId }
    });

    const realNumericId = ciudadano ? (ciudadano as any).numericId || ciudadano.id : 1;
    
    const tarjetasEncontradas = await this.metodoPagoCiudadanoRepository
      .createQueryBuilder('tarjeta')
      .where('tarjeta.ciudadano_id = :numericId', { numericId: realNumericId })
      .andWhere('tarjeta.estado = :estado', { estado: 'activo' })
      .getMany();

    return tarjetasEncontradas;
  }
}