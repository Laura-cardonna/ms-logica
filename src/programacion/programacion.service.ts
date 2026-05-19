import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { Programacion, EstadoProgramacion } from './entities/programacion.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Turno } from 'src/turno/entities/turno.entity'; 

@Injectable()
export class ProgramacionService {
  constructor(
    @InjectRepository(Programacion) private readonly programacionRepository: Repository<Programacion>,
    @InjectRepository(Bus) private readonly busRepository: Repository<Bus>,
    @InjectRepository(Ruta) private readonly rutaRepository: Repository<Ruta>,
    @InjectRepository(Turno) private readonly turnoRepository: Repository<Turno>,
  ) {}

  async create(createDto: CreateProgramacionDto) {
    const { busId, rutaId, fecha, horaSalida, margenToleranciaMinutos, tipoRecurrencia } = createDto;

    // 1. Validaciones de existencia y estado del Bus
    const bus = await this.busRepository.findOne({ where: { id: busId } });
    if (!bus) throw new NotFoundException(`Bus ${busId} no encontrado`);
    
    if (bus.estado && bus.estado.toLowerCase() === 'mantenimiento') {
      throw new BadRequestException(`El bus ${bus.placa || busId} no se puede programar porque está en MANTENIMIENTO.`);
    }

    const ruta = await this.rutaRepository.findOne({ where: { id: rutaId } });
    if (!ruta) throw new NotFoundException(`Ruta ${rutaId} no encontrada`);

    // --- VALIDACIÓN DE FECHA Y HORA PASADA ---
    const fechaValidarClean = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const [vYear, vMonth, vDay] = String(fechaValidarClean).split('-').map(Number);
    const [vHoras, vMinutos] = horaSalida.split(':').map(Number);
    
    const fechaHoraPropuesta = new Date(vYear, vMonth - 1, vDay, vHoras, vMinutos, 0);
    const ahora = new Date();

    if (fechaHoraPropuesta < ahora) {
      throw new BadRequestException(`No se puede crear una programación en el pasado. La fecha y hora ingresadas ya ocurrieron.`);
    }

    // --- ARREGLO DE ZONA HORARIA ---
    const fechaBaseClean = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const [year, month, day] = String(fechaBaseClean).split('-').map(Number);
    const fechaLocalCorrecta = new Date(year, month - 1, day);

    const fechasParaProgramar = this.generarFechas(fechaLocalCorrecta, tipoRecurrencia || 'none');
    const resultados: Programacion[] = [];

    const [horasNueva, minutosNueva] = horaSalida.split(':').map(Number);
    const minutosNuevaProg = horasNueva * 60 + minutosNueva;

    for (const f of fechasParaProgramar) {
      const yyyy = f.getFullYear();
      const mm = String(f.getMonth() + 1).padStart(2, '0');
      const dd = String(f.getDate()).padStart(2, '0');
      const fechaStr = `${yyyy}-${mm}-${dd}`;
      
// =========================================================================
      // 2. VALIDACIÓN HISTORIA HU-011: CONDUCTOR ASIGNADO EN ESE HORARIO (AJUSTADO A VISTAS)
      // =========================================================================
      const turnosDelBus = await this.turnoRepository.find({
        where: { bus: { id: busId } },
        relations: ['bus']
      });

      let tieneConductorAsignado = false;

      for (const turno of turnosDelBus) {
        // Ignorar de inmediato si el turno ya fue cerrado/finalizado por el operador
        if (turno.estado && turno.estado.toLowerCase() === 'finalizado') {
          continue;
        }

        if (turno.fecha && turno.horaInicio && turno.horaFin) {
          // 1. Extraer la fecha del turno como "YYYY-MM-DD" de forma limpia
          let tFechaStr = '';
          if (turno.fecha instanceof Date) {
            const tyyyy = turno.fecha.getFullYear();
            const tmm = String(turno.fecha.getMonth() + 1).padStart(2, '0');
            const tdd = String(turno.fecha.getDate()).padStart(2, '0');
            tFechaStr = `${tyyyy}-${tmm}-${tdd}`;
          } else {
            tFechaStr = String(turno.fecha).split('T')[0];
          }

          // 2. Si la fecha del turno coincide con el día evaluado en la ruta
          if (tFechaStr === fechaStr) {
            // Extraer las horas en formato 24h plano (HH:MM) evitando distorsiones del servidor
            const horaInicioRaw = turno.horaInicio.toLocaleTimeString('es-CO', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const horaFinRaw = turno.horaFin.toLocaleTimeString('es-CO', { hour12: false, hour: '2-digit', minute: '2-digit' });

            const minutosInicioTurno = this.HHMMtoMinutos(horaInicioRaw);
            const minutosFinTurno = this.HHMMtoMinutos(horaFinRaw);

            // Validar si los minutos de salida de la ruta caen dentro del turno operativo
            if (minutosNuevaProg >= minutosInicioTurno && minutosNuevaProg <= minutosFinTurno) {
              tieneConductorAsignado = true;
              break; // El bus está cubierto, salimos del bucle con éxito
            }
          }
        }
      }

      if (!tieneConductorAsignado) {
        throw new BadRequestException(
          `No se puede programar la ruta a las ${horaSalida} el día ${fechaStr}. El bus ${busId} no tiene ningún conductor con turno operativo asignado para ese rango horario.`
        );
      }
      // =========================================================================
      // 3. Validar Choque de Horario
      const todasLasProgramaciones = await this.programacionRepository.find({
        where: { bus: { id: busId } },
        relations: ['bus']
      });

      const programacionesDelDia = todasLasProgramaciones.filter(p => {
        let pFechaStr = '';
        if (p.fecha instanceof Date) {
          const pyyyy = p.fecha.getFullYear();
          const pmm = String(p.fecha.getMonth() + 1).padStart(2, '0');
          const pdd = String(p.fecha.getDate()).padStart(2, '0');
          pFechaStr = `${pyyyy}-${pmm}-${pdd}`;
        } else {
          pFechaStr = String(p.fecha).split('T')[0];
        }
        return pFechaStr === fechaStr;
      });

      for (const progExistente of programacionesDelDia) {
        const horaExistenteRaw = progExistente.horaSalida || "00:00:00";
        const [horasExistente, minutosExistente] = horaExistenteRaw.split(':').map(Number);
        const minutesExistenteProg = horasExistente * 60 + minutosExistente;

        const diferenciaMinutos = Math.abs(minutosNuevaProg - minutesExistenteProg);

        if (diferenciaMinutos < 60) {
          throw new ConflictException(
            `Conflicto de horario: El bus ya está programado a las ${horaExistenteRaw} el día ${fechaStr}. Debe existir un margen mínimo de 1 hora entre viajes.`
          );
        }
      }

      // 4. Creación si pasa los filtros
      const nuevaProg = this.programacionRepository.create({
        bus: { id: busId },
        ruta: { id: rutaId },
        fecha: f,
        horaSalida,
        margenToleranciaMinutos: margenToleranciaMinutos || 0,
        tipoRecurrencia: tipoRecurrencia || 'none',
        estado: EstadoProgramacion.PROGRAMADO,
      });

      const guardado = await this.programacionRepository.save(nuevaProg);
      resultados.push(guardado);
    }

    return resultados;
  }

  private async validarDisponibilidad(busId: number, fecha: string, hora: string, margen: number) {
    const progs = await this.programacionRepository.find({
      where: { bus: { id: busId }, fecha: new Date(fecha), estado: 'programado' }
    });
    const minutosNueva = this.HHMMtoMinutos(hora);
    for (const p of progs) {
      const minutosExistente = this.HHMMtoMinutos(p.horaSalida || '00:00'); 
      const diferencia = Math.abs(minutosNueva - minutosExistente);
      if (diferencia < margen) {
        throw new ConflictException(`Conflicto de horario: El bus ya está ocupado en un rango de ${margen} minutos.`);
      }
    }
  }

  private generarFechas(inicio: Date, tipo: string): Date[] {
    const fechas = [new Date(inicio)];
    if (tipo === 'none') return fechas;
    const limite = new Date(inicio);
    limite.setDate(limite.getDate() + 30);
    const actual = new Date(inicio);
    while (actual < limite) {
      actual.setDate(actual.getDate() + 1);
      const dia = actual.getDay();
      if (tipo === 'diaria') fechas.push(new Date(actual));
      else if (tipo === 'lunes_viernes' && dia >= 1 && dia <= 5) fechas.push(new Date(actual));
      else if (tipo === 'fines_de_semana' && (dia === 0 || dia === 6)) fechas.push(new Date(actual));
    }
    return fechas;
  }

  private HHMMtoMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  findAll() {
    return this.programacionRepository.find({ relations: ['bus', 'ruta'] });
  }

  async findOne(id: number) {
    const p = await this.programacionRepository.findOne({ where: { id }, relations: ['bus', 'ruta'] });
    if (!p) throw new NotFoundException('Programación no encontrada');
    return p;
  }
}