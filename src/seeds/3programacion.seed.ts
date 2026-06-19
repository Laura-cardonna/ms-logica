import { DataSource } from 'typeorm';
import { Programacion, EstadoProgramacion } from '../programacion/entities/programacion.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Ruta } from '../ruta/entities/ruta.entity';

function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hourPart, minutePart] = time.split(':').map(Number);
  const totalMinutes = hourPart * 60 + minutePart + minutesToAdd;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalizedMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (normalizedMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export async function seedProgramaciones(dataSource: DataSource) {
  const programacionRepository = dataSource.getRepository(Programacion);
  const busRepository = dataSource.getRepository(Bus);
  const rutaRepository = dataSource.getRepository(Ruta);

  const buses = await busRepository.find();
  const rutas = await rutaRepository.find();

  if (buses.length === 0 || rutas.length === 0) {
    console.warn('⚠ No buses o rutas found. Run bus.seed and ruta.seed first');
    return;
  }

  // Ajustado el límite mínimo ya que ahora solo usamos los primeros buses y rutas
  if (buses.length < 3 || rutas.length < 4) {
    console.warn(
      '⚠ Se requieren al menos 3 buses y 4 rutas para sembrar estas 5 programaciones',
    );
    return;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const programaciones = [
    {
      // HU-3-001: bus ACTIVO y RETRASADO (salió 06:00, sin tolerancia) → banner + marcador rojo
      fecha: today,
      horaSalida: '06:00',
      horaLlegada: addMinutesToTime(
        '06:00',
        Number(rutas[0].duracionEstimada ?? 35),
      ),
      duracionEstimada: Number(rutas[0].duracionEstimada ?? 35),
      estado: EstadoProgramacion.EN_CURSO,
      margenToleranciaMinutos: 0,
      bus: buses[0],
      ruta: rutas[0], // Ruta Centro - Sur (tiene paraderos)
    },
    {
      fecha: today,
      horaSalida: '08:30',
      horaLlegada: addMinutesToTime(
        '08:30',
        Number(rutas[1].duracionEstimada ?? 40),
      ),
      duracionEstimada: Number(rutas[1].duracionEstimada ?? 40),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[0],
      ruta: rutas[1],
    },
    {
      // HU-3-001: bus ACTIVO en horario (tolerancia amplia) → marcador verde, misma ruta
      fecha: today,
      horaSalida: '14:00',
      horaLlegada: addMinutesToTime(
        '14:00',
        Number(rutas[0].duracionEstimada ?? 35),
      ),
      duracionEstimada: Number(rutas[0].duracionEstimada ?? 35),
      estado: EstadoProgramacion.EN_CURSO,
      margenToleranciaMinutos: 1440,
      bus: buses[1],
      ruta: rutas[0], // Ruta Centro - Sur (tiene paraderos)
    },
    {
      fecha: today,
      horaSalida: '16:30',
      horaLlegada: addMinutesToTime(
        '16:30',
        Number(rutas[3].duracionEstimada ?? 90),
      ),
      duracionEstimada: Number(rutas[3].duracionEstimada ?? 90),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[1],
      ruta: rutas[3],
    },
    {
      fecha: tomorrow,
      horaSalida: '06:00',
      horaLlegada: addMinutesToTime(
        '06:00',
        Number(rutas[0].duracionEstimada ?? 35),
      ),
      duracionEstimada: Number(rutas[0].duracionEstimada ?? 35),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[2],
      ruta: rutas[0],
    },
    {
      // Ruta Centro - Chipre (Madrugada de hoy - Ya finalizada)
      fecha: today,
      horaSalida: '05:30',
      horaLlegada: addMinutesToTime('05:30', Number(rutas[4]?.duracionEstimada ?? 20)),
      duracionEstimada: Number(rutas[4]?.duracionEstimada ?? 20),
      estado: EstadoProgramacion.PROGRAMADO, // Cambiar a tu Estado correspondiente a FINALIZADO si posees uno, de lo contrario programado
      bus: buses[3],
      ruta: rutas[4],
    },
    {
      // Ruta Universitaria en curso (Hora pico de la mañana)
      fecha: today,
      horaSalida: '07:15',
      horaLlegada: addMinutesToTime('07:15', Number(rutas[5]?.duracionEstimada ?? 45)),
      duracionEstimada: Number(rutas[5]?.duracionEstimada ?? 45),
      estado: EstadoProgramacion.EN_CURSO,
      margenToleranciaMinutos: 5,
      bus: buses[4],
      ruta: rutas[5],
    },
    {
      // Ruta Avenida Santander - La Enea (Hora pico del mediodía)
      fecha: today,
      horaSalida: '12:10',
      horaLlegada: addMinutesToTime('12:10', Number(rutas[6]?.duracionEstimada ?? 50)),
      duracionEstimada: Number(rutas[6]?.duracionEstimada ?? 50),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[5],
      ruta: rutas[6],
    },
    {
      // Refuerzo en horario de la tarde para el Sur
      fecha: today,
      horaSalida: '15:15',
      horaLlegada: addMinutesToTime('15:15', Number(rutas[0].duracionEstimada ?? 35)),
      duracionEstimada: Number(rutas[0].duracionEstimada ?? 35),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[6],
      ruta: rutas[0],
    },
    {
      // Ruta Nocturna Centro - Norte
      fecha: today,
      horaSalida: '20:00',
      horaLlegada: addMinutesToTime('20:00', Number(rutas[1].duracionEstimada ?? 40)),
      duracionEstimada: Number(rutas[1].duracionEstimada ?? 40),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[7],
      ruta: rutas[1],
    },
    {
      // MAÑANA: Operación Temprana Villamaría
      fecha: tomorrow,
      horaSalida: '06:15',
      horaLlegada: addMinutesToTime('06:15', Number(rutas[2]?.duracionEstimada ?? 30)),
      duracionEstimada: Number(rutas[2]?.duracionEstimada ?? 30),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[8],
      ruta: rutas[2],
    },
    {
      // MAÑANA: Universitaria Turno Mañana
      fecha: tomorrow,
      horaSalida: '07:45',
      horaLlegada: addMinutesToTime('07:45', Number(rutas[5]?.duracionEstimada ?? 45)),
      duracionEstimada: Number(rutas[5]?.duracionEstimada ?? 45),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[9],
      ruta: rutas[5],
    },
    {
      // MAÑANA: Circular Manizales Completa
      fecha: tomorrow,
      horaSalida: '09:00',
      horaLlegada: addMinutesToTime('09:00', Number(rutas[3].duracionEstimada ?? 90)),
      duracionEstimada: Number(rutas[3].duracionEstimada ?? 90),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[10],
      ruta: rutas[3],
    },
    {
      // MAÑANA: Ruta Centro - Villa Pilar
      fecha: tomorrow,
      horaSalida: '11:30',
      horaLlegada: addMinutesToTime('11:30', Number(rutas[4]?.duracionEstimada ?? 20)),
      duracionEstimada: Number(rutas[4]?.duracionEstimada ?? 20),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[11],
      ruta: rutas[4],
    },
    {
      // MAÑANA: Ruta Expresa Cable Aéreo - Centro (Tarde)
      fecha: tomorrow,
      horaSalida: '17:15',
      horaLlegada: addMinutesToTime('17:15', Number(rutas[6]?.duracionEstimada ?? 50)),
      duracionEstimada: Number(rutas[6]?.duracionEstimada ?? 50),
      estado: EstadoProgramacion.PROGRAMADO,
      bus: buses[12],
      ruta: rutas[6],
    },
  ];

  for (const programacion of programaciones) {
    const existing = await programacionRepository.findOne({
      where: {
        fecha: programacion.fecha,
        horaSalida: programacion.horaSalida,
      },
    });
    if (!existing) {
      await programacionRepository.save(programacion);
    }
  }

  console.log('✓ 5 Programaciones seeded');
}