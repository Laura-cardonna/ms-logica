import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, FindOptionsRelations } from 'typeorm';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { Boleto } from './entities/boleto.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { MetodoPago } from 'src/metodo_pago/entities/metodo_pago.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import {
  DetalleViajeResponseDto,
  CoordenadaRutaDto,
  ValidacionViajeDto,
} from './dto/detalle-viaje-response.dto';

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
    private readonly validacionRepository: Repository<Validacion>,
    @InjectRepository(RutaParadero)
    private readonly rutaParaderoRepository: Repository<RutaParadero>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

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
   * CREAR BOLETO (ABORDAJE)
   */
  async create(data: {
    bus_id?: number;
    paraderoAbordaje_id?: number;
    metodoPagoCiudadano_id?: number;
    ciudadano_id?: string;
  }) {
    console.log('--- Iniciando proceso de abordaje (Validación de Saldo) ---');

    const ciudadano = await this.ciudadanoRepository.findOne({
      where: { id: data.ciudadano_id },
    });

    if (!ciudadano) {
      throw new UnauthorizedException('Ciudadano no encontrado.');
    }

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

    const tarjeta = await this.metodoPagoCiudadanoRepository.findOne({
      where: { id: data.metodoPagoCiudadano_id },
      relations: { ciudadano: true },
    });

    if (!tarjeta) {
      throw new NotFoundException(
        'La tarjeta seleccionada no existe en el sistema.',
      );
    }

    if (tarjeta.ciudadano?.id !== ciudadano.id) {
      throw new BadRequestException('Esta tarjeta pertenece a otro usuario.');
    }

    if (tarjeta.estado !== 'activo') {
      throw new BadRequestException(
        'La tarjeta seleccionada se encuentra inactiva.',
      );
    }

    const programacion = await this.programacionRepository.findOne({
      where: { estado: 'en_curso' as any, bus: { id: data.bus_id } },
      relations: { bus: true, ruta: true, boletos: true },
    });

    if (!programacion) {
      throw new NotFoundException(
        'No hay una programación en ruta activa para este autobús.',
      );
    }

    const capacidad = Number(programacion.bus?.capacidadMaxima ?? 0);
    const ocupados = (programacion.boletos ?? []).filter(
      (b) => b.estado === 'activo',
    ).length;

    if (ocupados >= capacidad) {
      try {
        const datosValidacion: any = {
          tipo: 'abordaje',
          motivo:
            'Abordaje rechazado: El bus ha alcanzado su capacidad máxima.',
        };
        if (data.paraderoAbordaje_id) {
          datosValidacion.paradero = { id: data.paraderoAbordaje_id };
        }
        await this.validacionRepository.save(datosValidacion);
      } catch (auditError) {
        console.error('⚠️ Error guardando auditoría:', auditError);
      }
      throw new ConflictException(
        'Abordaje rechazado: El bus ha alcanzado su capacidad máxima.',
      );
    }

    const tarifa = Number(programacion.ruta?.tarifa ?? 0);
    const saldoActual = Number(tarjeta.saldo ?? 0);

    if (saldoActual < tarifa) {
      throw new BadRequestException(
        `Saldo insuficiente. Tarifa: $${tarifa}. Saldo: $${saldoActual}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      tarjeta.saldo = saldoActual - tarifa;

      await queryRunner.manager.update(
        MetodoPagoCiudadano,
        { id: tarjeta.id },
        { saldo: tarjeta.saldo },
      );

      const ciudadanoIdStr = String(ciudadano.id || '0000');
      const suffix = ciudadanoIdStr.substring(0, 4).toUpperCase();

      const nuevoBoleto = queryRunner.manager.create(Boleto, {
        numeroBoleto: `BOL-${Date.now()}-${suffix}`,
        costo: tarifa,
        inicioViaje: new Date(),
        estado: 'activo',
        ciudadano: ciudadano,
        programacion: programacion,
        metodoPagoCiudadano: tarjeta,
        ruta: programacion.ruta,
        paraderoAbordaje: data.paraderoAbordaje_id
          ? { id: data.paraderoAbordaje_id }
          : null,
      } as any);

      const boletoGuardado = await queryRunner.manager.save(
        Boleto,
        nuevoBoleto,
      );

      const nuevaValidacion = queryRunner.manager.create(Validacion, {
        tipo: 'abordaje',
        motivo: 'Abordaje exitoso',
        boleto: boletoGuardado,
        paradero: data.paraderoAbordaje_id
          ? { id: data.paraderoAbordaje_id }
          : null,
      } as any);

      await queryRunner.manager.save(Validacion, nuevaValidacion);
      await queryRunner.commitTransaction();

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
   * FINALIZAR VIAJE (DESCENSO)
   */
  async finalizarViaje(data: {
    boleto_id: number;
    paraderoDescenso_id: number;
  }) {
    const boleto = await this.boletoRepository.findOne({
      where: { id: data.boleto_id },
      relations: this.boletoRelations,
    });

    if (!boleto) {
      throw new NotFoundException('El boleto especificado no existe.');
    }

    if (boleto.estado === 'completado') {
      throw new BadRequestException(
        'Este viaje ya había sido completado previamente.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      boleto.estado = 'completado';
      boleto.finViaje = new Date();

      const boletoActualizado = await queryRunner.manager.save(Boleto, boleto);

      const nuevaValidacionDescenso = queryRunner.manager.create(Validacion, {
        tipo: 'descenso',
        motivo: 'Viaje completado - Gracias por usar nuestro servicio',
        boleto: boletoActualizado,
        paradero: data.paraderoDescenso_id
          ? { id: data.paraderoDescenso_id }
          : null,
      } as any);

      await queryRunner.manager.save(Validacion, nuevaValidacionDescenso);
      await queryRunner.commitTransaction();

      return {
        mensaje: 'Viaje completado - Gracias por usar nuestro servicio',
        boleto: await this.findOne(boletoActualizado.id as number),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


async obtenerParaderosDescenso(boletoId: number) {
  const boleto = await this.boletoRepository.findOne({
    where: { id: boletoId },
    relations: ['ruta', 'programacion', 'programacion.ruta'],
  });

  if (!boleto) throw new NotFoundException('El viaje no existe');

  const rutaId = boleto.programacion?.ruta?.id || boleto.ruta?.id;
  if (!rutaId) return [];

  // 1. Obtener paradero de abordaje de la validación
  const validacionAbordaje = await this.validacionRepository.findOne({
    where: { boleto: { id: boletoId }, tipo: 'abordaje' },
    relations: ['paradero'],
  });
  const paraderoAbordajeId = validacionAbordaje?.paradero?.id;

  // 2. CONSULTA SQL PURA (Para descartar errores de TypeORM)
  // Nota: Asegúrate que los nombres de las tablas sean correctos (ruta_paradero y paraderos)
  const resultados: any[] = await this.dataSource.query(`
    SELECT 
      p.id, 
      p.nombre, 
      p.descripcion, 
      p.latitud, 
      p.longitud, 
      rp.orden_secuencial as ordenSecuencial
    FROM ruta_paradero rp
    INNER JOIN paraderos p ON rp.paradero_id = p.id
    WHERE rp.ruta_id = ?
    ORDER BY rp.orden_secuencial ASC
  `, [rutaId]);

  console.log(`SQL Raw - Buscando Ruta ID ${rutaId}. Encontrados: ${resultados.length}`);

  // 3. Filtrar el paradero de abordaje
  return resultados
    .filter((p) => p.id !== paraderoAbordajeId)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre || 'Sin nombre',
      descripcion: p.descripcion || '',
      latitud: p.latitud || 0,
      longitud: p.longitud || 0,
      ordenSecuencial: p.ordenSecuencial || 0,
    }));
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

  async getTarjetasByUserId(ciudadanoId: string) {
    const ciudadano = await this.ciudadanoRepository.findOne({
      where: { id: ciudadanoId },
    });

    const realNumericId = ciudadano
      ? (ciudadano as any).numericId || ciudadano.id
      : 1;

    let tarjetasEncontradas = await this.metodoPagoCiudadanoRepository.find({
      where: {
        ciudadano: { numericId: realNumericId },
        estado: 'activo',
      },
      relations: ['metodoPago'],
    });

    if (tarjetasEncontradas.length === 0 && ciudadano) {
      // Intentar buscar un MetodoPago base
      let metodoPago = await this.dataSource.getRepository(MetodoPago).findOne({
        where: { nombre: 'Tarjeta de Débito' },
      });
      if (!metodoPago) {
        metodoPago = await this.dataSource.getRepository(MetodoPago).findOne({
          where: {},
        });
      }

      const cleanName = (ciudadano.nombre || 'CITY')
        .replace(/[^a-zA-Z]/g, '')
        .substring(0, 5)
        .toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const cardId = `TARJ-${cleanName}-${randomSuffix}`;

      const nuevaTarjeta = this.metodoPagoCiudadanoRepository.create({
        identificadorInstrumento: cardId,
        saldo: 50000,
        estado: 'activo',
        fechaRecarga: new Date(),
        ciudadano: ciudadano,
        metodoPago: metodoPago || undefined,
      });

      const tarjetaGuardada =
        await this.metodoPagoCiudadanoRepository.save(nuevaTarjeta);

      // Volver a consultar para asegurar que las relaciones (metodoPago) estén cargadas correctamente
      const tarjetaCargada = await this.metodoPagoCiudadanoRepository.findOne({
        where: { id: tarjetaGuardada.id },
        relations: ['metodoPago'],
      });

      if (tarjetaCargada) {
        tarjetasEncontradas = [tarjetaCargada];
      } else {
        tarjetasEncontradas = [tarjetaGuardada];
      }
    }

    return tarjetasEncontradas;
  }

  async obtenerRecorrido(boletoId: number) {
    const boleto = await this.boletoRepository.findOne({
      where: { id: boletoId },
      relations: [
        'ruta',
        'programacion',
        'programacion.bus',
        'programacion.ruta',
      ],
    });

    if (!boleto) {
      throw new NotFoundException('El viaje especificado no existe');
    }

    let rutaParaderos: RutaParadero[] = [];
    if (boleto.ruta?.id) {
      rutaParaderos = await this.rutaParaderoRepository.find({
        where: { ruta: { id: boleto.ruta.id } },
        relations: ['paradero'],
        order: { ordenSecuencial: 'ASC' },
      });
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
      if (turno?.conductor?.nombre)
        conductorNombre = String(turno.conductor.nombre);
    }

    const coordenadasMapa = rutaParaderos.map((rp) => ({
      ordenSecuencial: rp.ordenSecuencial || 0,
      latitud: rp.paradero?.latitud || 0,
      longitud: rp.paradero?.longitud || 0,
    }));

    const validaciones: ValidacionViajeDto[] = validacionesEntidades
      .filter((v) => v.tipo && v.fecha)
      .map((v) => ({
        tipo: v.tipo!,
        horaExacta: v.fecha!,
        paradero: {
          id: v.paradero?.id || 0,
          nombre: v.paradero?.nombre || '',
          latitud: v.paradero?.latitud || 0,
          longitud: v.paradero?.longitud || 0,
        },
      }));

    let tiempoTotalMinutos = 0;
    if (validaciones.length > 1) {
      const primeraValidacion = validaciones[0];
      const ultimaValidacion = validaciones[validaciones.length - 1];
      tiempoTotalMinutos = Math.round(
        (ultimaValidacion.horaExacta.getTime() -
          primeraValidacion.horaExacta.getTime()) /
          60000,
      );
    }

    return {
      boletoId: boleto.id!,
      ruta: {
        nombre: boleto.ruta?.nombre || 'Ruta sin nombre',
        coordenadasMapa,
      },
      validaciones,
      tiempoTotalMinutos,
      operacion: {
        busPlaca: boleto.programacion?.bus?.placa || 'Sin placa',
        conductorNombre: conductorNombre,
      },
    };
  }

/**
   * 🌟 HU-ENTR-3-008: Obtener la lista de Ciudadanos según el alcance configurado
   */
  async obtenerDestinatariosAlerta(alcanceTipo: string, alcanceId?: string): Promise<Ciudadano[]> {
    if (alcanceTipo === 'TODOS') {
      return await this.ciudadanoRepository.find();
    }

    if (alcanceTipo === 'RUTA' && alcanceId) {
      const boletosActivos = await this.boletoRepository.find({
        where: {
          ruta: { id: Number(alcanceId) },
          estado: 'activo'
        },
        relations: ['ciudadano']
      });

      const ciudadanosMapeados = boletosActivos
        .map(b => b.ciudadano)
        .filter((c): c is Ciudadano => !!c && c.id !== undefined); // Asegura que c y c.id no sean undefined

      const deDuplicados = new Map<string | number, Ciudadano>();
      ciudadanosMapeados.forEach(c => {
        if (c.id !== undefined) {
          deDuplicados.set(c.id, c);
        }
      });
      return Array.from(deDuplicados.values());
    }

    if (alcanceTipo === 'ZONA' && alcanceId) {
      return [];
    }

    return [];
  }

  /**
   * 🌟 HU-ENTR-3-008: Contador previo de destinatarios para el Administrador
   */
  async contarDestinatariosAlerta(alcanceTipo: string, alcanceId?: string): Promise<{ total: number }> {
    const destinatarios = await this.obtenerDestinatariosAlerta(alcanceTipo, alcanceId);
    return { total: destinatarios.length };
  }

}
