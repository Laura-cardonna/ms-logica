import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { Programacion, EstadoProgramacion } from './entities/programacion.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import {BadRequestException } from '@nestjs/common';
@Injectable()
export class ProgramacionService {
  constructor(
    @InjectRepository(Programacion) private readonly programacionRepository: Repository<Programacion>,
    @InjectRepository(Bus) private readonly busRepository: Repository<Bus>,
    @InjectRepository(Ruta) private readonly rutaRepository: Repository<Ruta>,
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
    // Extraemos los componentes de fecha y hora puros para construir la fecha propuesta en hora local
    const fechaValidarClean = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const [vYear, vMonth, vDay] = String(fechaValidarClean).split('-').map(Number);
    const [vHoras, vMinutos] = horaSalida.split(':').map(Number);
    
    const fechaHoraPropuesta = new Date(vYear, vMonth - 1, vDay, vHoras, vMinutos, 0);
    const ahora = new Date();

    if (fechaHoraPropuesta < ahora) {
      throw new BadRequestException(
        `No se puede crear una programación en el pasado. La fecha y hora ingresadas ya ocurrieron.`
      );
    }
    // ------------------------------------------

    // --- ARREGLO DE ZONA HORARIA ---
    // Nos aseguramos de leer la fecha como string puro y evitar que "new Date()" le reste horas locales
    const fechaBaseClean = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const [year, month, day] = String(fechaBaseClean).split('-').map(Number);
    const fechaLocalCorrecta = new Date(year, month - 1, day);

    // 2. Lógica de Recurrencia (Pasamos la fecha ya normalizada en local)
    const fechasParaProgramar = this.generarFechas(fechaLocalCorrecta, tipoRecurrencia || 'none');
    const resultados: Programacion[] = [];

    // Convertimos la hora elegida a minutos totales del día
    const [horasNueva, minutosNueva] = horaSalida.split(':').map(Number);
    const minutosNuevaProg = horasNueva * 60 + minutosNueva;

    for (const f of fechasParaProgramar) {
      // Formateamos de forma manual y exacta a YYYY-MM-DD sin usar toISOString() que cambia el día
      const yyyy = f.getFullYear();
      const mm = String(f.getMonth() + 1).padStart(2, '0');
      const dd = String(f.getDate()).padStart(2, '0');
      const fechaStr = `${yyyy}-${mm}-${dd}`;
      
      // 3. Validar Choque de Horario (Buscamos todas las programaciones cargando la relación)
      const todasLasProgramaciones = await this.programacionRepository.find({
        where: { bus: { id: busId } },
        relations: ['bus']
      });

      // Filtramos exactamente por el string "YYYY-MM-DD" real guardado en BD
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

      console.log(`[Validación] Bus ${busId} el día ${fechaStr} tiene ${programacionesDelDia.length} viajes agendados.`);

      for (const progExistente of programacionesDelDia) {
        const horaExistenteRaw = progExistente.horaSalida || "00:00:00";
        const [horasExistente, minutosExistente] = horaExistenteRaw.split(':').map(Number);
        const minutesExistenteProg = horasExistente * 60 + minutosExistente;

        const diferenciaMinutos = Math.abs(minutosNuevaProg - minutesExistenteProg);

        console.log(`-> Comparando nueva (${horaSalida}) con existente (${horaExistenteRaw}). Diferencia: ${diferenciaMinutos}min`);

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
      // CORREGIDO: Asegura un string válido si horaSalida llega a ser undefined
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
    limite.setDate(limite.getDate() + 30); // Generar para 1 mes útil
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