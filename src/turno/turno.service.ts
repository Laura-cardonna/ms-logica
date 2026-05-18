// src/turno/turno.service.ts
import { 
  BadRequestException, 
  Injectable, 
  NotFoundException, 
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from './entities/turno.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Conductor } from 'src/conductor/entities/conductor.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import {Raw } from 'typeorm';

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,

    @InjectRepository(Programacion)
    private readonly programacionRepository: Repository<Programacion>,

    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,

    @InjectRepository(Conductor)
    private readonly conductorRepository: Repository<Conductor>,
    
  ) {}

  /**
   * Método para que el Gerente cree un turno de forma manual
   * 🛡️ Validaciones de Reglas de Negocio Robustas Integradas
   */
  async create(createTurnoDto: CreateTurnoDto): Promise<Turno> {
    const { busId, conductorId, fecha, horaInicio, horaFin } = createTurnoDto;

    // Validamos que los datos necesarios hayan llegado en la petición
    if (!busId || !conductorId || !fecha || !horaInicio || !horaFin) {
      throw new BadRequestException('Todos los campos (busId, conductorId, fecha, horaInicio, horaFin) son requeridos.');
    }

    // 1. Validar que el bus exista
    const bus = await this.busRepository.findOne({ where: { id: busId } });
    if (!bus) {
      throw new NotFoundException(`El bus con ID ${busId} no existe.`);
    }

    // 2. Regla de negocio: El bus no debe estar en mantenimiento
    if (bus.estado?.toLowerCase() === 'mantenimiento') {
      throw new BadRequestException(`No se puede asignar el turno: El bus con placa ${bus.placa} se encuentra en mantenimiento.`);
    }

    // 🚨 NUEVA REGLA: El bus no debe estar ocupado en otro turno 'en_curso'
    const busOcupado = await this.turnoRepository.findOne({
      where: { bus: { id: busId }, estado: 'en_curso' }
    });
    if (busOcupado) {
      throw new ConflictException(`El vehículo con placa ${bus.placa} ya se encuentra operando en ruta activa.`);
    }

    // 3. Validar que el conductor exista
    const conductor = await this.conductorRepository.findOne({ where: { id: conductorId as any } });
    if (!conductor) {
      throw new NotFoundException(`El conductor con ID ${conductorId} no existe.`);
    }

    // 🚨 NUEVA REGLA: El conductor no debe estar en otro turno activo al mismo tiempo
    const conductorOcupado = await this.turnoRepository.findOne({
      where: { conductor: { id: conductorId as any }, estado: 'en_curso' }
    });
    if (conductorOcupado) {
      throw new ConflictException(`El operador ${conductor.nombre} ya tiene una jornada activa en curso en este momento.`);
    }

    // 4. Crear la instancia del turno asegurando que se respete la fecha local
    const nuevoTurno = this.turnoRepository.create({
      fecha: fecha as any,        
      horaInicio: horaInicio as any, 
      horaFin: horaFin as any,     
      estado: 'programado',
      bus,
      conductor,
    });

    // 5. Guardar en la base de datos
    return await this.turnoRepository.save(nuevoTurno);
  }

  /**
   * Métodos operativos existentes para la vista del conductor
   */
  async obtenerMisTurnos(usuarioId: string) {
    console.log('🔍 [Backend] Buscando turnos en la BD para el conductor UUID:', usuarioId);

    const turnos = await this.turnoRepository.find({
      where: { 
        conductor: { id: usuarioId } 
      },
      relations: ['bus'],
      order: { id: 'DESC' }
    });

    //console.log(`📊 [Backend] Se encontraron ${turnos.length} turnos para este operador en la base de datos.`, turnos);
    return turnos;
  }
  
async iniciarTurno(
    turnoId: number, 
    conductorId: string, 
    estadoBusConfirmado: string, 
    observaciones?: string
  ) {
    // 1. Buscamos el turno e incluimos la relación 'bus' para saber cuál va a operar
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId, conductor: { id: conductorId } },
      relations: ['bus'] // 👈 Crucial para poder saber el ID del bus
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado.');
    }

    // 2. Mantenemos intacto todo tu checklist y estados originales
    turno.estadoBusConfirmado = estadoBusConfirmado; 
    turno.observaciones = observaciones || 'Sin observaciones';
    turno.estado = 'en_curso'; 

    // Guardamos los cambios del turno en la base de datos
    const turnoGuardado = await this.turnoRepository.save(turno);

    // =======================================================================
    // 🎯 INTEGRACIÓN REAL: ENLAZAR Y ACTIVAR LA PROGRAMACIÓN DEL GERENTE
    // =======================================================================
    try {
      // Obtenemos la fecha de hoy en formato local YYYY-MM-DD sin desfase de zona horaria
      const hoy = new Date();
      const año = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      const fechaHoyStr = `${año}-${mes}-${dia}`;

      if (turno.bus && turno.bus.id) {
        // Buscamos la programación que creó el gerente para HOY y para este BUS específico
        const programacionAsociada = await this.programacionRepository.findOne({
          where: {
            bus: { id: turno.bus.id },
            // 🔥 SOLUCIÓN AL ERROR TS2322: Comparamos la fecha usando Raw nativo de TypeORM
            fecha: Raw((alias) => `DATE(${alias}) = :fechaHoy`, { fechaHoy: fechaHoyStr }),
            estado: 'programado' // Filtramos solo las que están pendientes por arrancar
          }
        });

        if (programacionAsociada) {
          // Cambiamos el estado de la programación al valor estricto que espera el validador de pasajes
          programacionAsociada.estado = 'en_curso';
          await this.programacionRepository.save(programacionAsociada);
          console.log(`🚀 [INTEGRACIÓN] ¡Éxito! Programación ID ${programacionAsociada.id} activada automáticamente.`);
        } else {
          console.warn(`⚠️ [INTEGRACIÓN] No se encontró programación 'programada' para el bus ID ${turno.bus.id} hoy (${fechaHoyStr}).`);
        }
      }
    } catch (error) {
      // Si algo falla buscando la programación, el try/catch la atrapa y permite que el turno del chofer continúe activo
      console.error('❌ [INTEGRACIÓN] Error al intentar actualizar de forma automática la programación:', error);
    }

    // Retornamos exactamente el mismo objeto que ya tenías
    return turnoGuardado;
  }

  /**
   * 🚀 NUEVO MÉTODO: Cierra la jornada operativa de forma segura
   */
  async finalizarTurno(turnoId: number, conductorId: string) {
    console.log(`🏁 [Backend] Solicitando cierre para el turno ID: ${turnoId} del conductor: ${conductorId}`);

    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId, conductor: { id: conductorId } }
    });

    if (!turno) {
      throw new NotFoundException('No se encontró el turno activo asignado a tu usuario para finalizar.');
    }

    if (turno.estado !== 'en_curso') {
      throw new BadRequestException('Este turno no se puede finalizar porque no está en curso.');
    }

    // Cambiamos el estado a finalizado para liberar el sistema
    turno.estado = 'finalizado';

    await this.turnoRepository.save(turno);

    return {
      success: true,
      message: '🏁 Jornada finalizada con éxito. Registro de operación salvado y GPS desconectado.'
    };
  }

  // 📁 Dentro de tu turno.service.ts agrega este método:

async obtenerTurnoActivo(conductorId: string): Promise<Turno> {
  const turnoActivo = await this.turnoRepository.findOne({
    where: {
      conductor: { id: conductorId },
      estado: 'en_curso', // O como manejes el string del estado activo
    },
    relations: ['bus', 'conductor'], // Traemos las relaciones por si el front las necesita para mostrar info del bus
  });

  if (!turnoActivo) {
    throw new NotFoundException('No se encontró ningún turno activo "en_curso" para este conductor.');
  }

  return turnoActivo;
  }
}