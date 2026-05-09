import { DataSource } from 'typeorm';
import { Programacion } from '../programacion/entities/programacion.entity';
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

  if (buses.length < 7 || rutas.length < 4) {
    console.warn(
      '⚠ Se requieren al menos 7 buses y 4 rutas para sembrar programaciones completas',
    );
    return;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const programaciones = [
    {
      fecha: today,
      horaSalida: '06:00',
      horaLlegada: addMinutesToTime(
        '06:00',
        Number(rutas[0].duracionEstimada ?? 35),
      ),
      duracionEstimada: Number(rutas[0].duracionEstimada ?? 35),
      estado: 'activa',
      bus: buses[0],
      ruta: rutas[0],
    },
    {
      fecha: today,
      horaSalida: '08:30',
      horaLlegada: addMinutesToTime(
        '08:30',
        Number(rutas[1].duracionEstimada ?? 40),
      ),
      duracionEstimada: Number(rutas[1].duracionEstimada ?? 40),
      estado: 'programada',
      bus: buses[0],
      ruta: rutas[1],
    },
    {
      fecha: today,
      horaSalida: '14:00',
      horaLlegada: addMinutesToTime(
        '14:00',
        Number(rutas[2].duracionEstimada ?? 30),
      ),
      duracionEstimada: Number(rutas[2].duracionEstimada ?? 30),
      estado: 'activa',
      bus: buses[1],
      ruta: rutas[2],
    },
    {
      fecha: today,
      horaSalida: '16:30',
      horaLlegada: addMinutesToTime(
        '16:30',
        Number(rutas[3].duracionEstimada ?? 90),
      ),
      duracionEstimada: Number(rutas[3].duracionEstimada ?? 90),
      estado: 'programada',
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
      estado: 'programada',
      bus: buses[2],
      ruta: rutas[0],
    },
    {
      fecha: tomorrow,
      horaSalida: '09:00',
      horaLlegada: addMinutesToTime(
        '09:00',
        Number(rutas[1].duracionEstimada ?? 40),
      ),
      duracionEstimada: Number(rutas[1].duracionEstimada ?? 40),
      estado: 'programada',
      bus: buses[2],
      ruta: rutas[1],
    },
    {
      fecha: tomorrow,
      horaSalida: '13:30',
      horaLlegada: addMinutesToTime(
        '13:30',
        Number(rutas[2].duracionEstimada ?? 30),
      ),
      duracionEstimada: Number(rutas[2].duracionEstimada ?? 30),
      estado: 'programada',
      bus: buses[3],
      ruta: rutas[2],
    },
    {
      fecha: tomorrow,
      horaSalida: '17:00',
      horaLlegada: addMinutesToTime(
        '17:00',
        Number(rutas[3].duracionEstimada ?? 90),
      ),
      duracionEstimada: Number(rutas[3].duracionEstimada ?? 90),
      estado: 'programada',
      bus: buses[3],
      ruta: rutas[3],
    },
    {
      fecha: dayAfter,
      horaSalida: '07:00',
      horaLlegada: addMinutesToTime(
        '07:00',
        Number(rutas[0].duracionEstimada ?? 35),
      ),
      duracionEstimada: Number(rutas[0].duracionEstimada ?? 35),
      estado: 'programada',
      bus: buses[4],
      ruta: rutas[0],
    },
    {
      fecha: dayAfter,
      horaSalida: '10:30',
      horaLlegada: addMinutesToTime(
        '10:30',
        Number(rutas[1].duracionEstimada ?? 40),
      ),
      duracionEstimada: Number(rutas[1].duracionEstimada ?? 40),
      estado: 'programada',
      bus: buses[5],
      ruta: rutas[1],
    },
    {
      fecha: dayAfter,
      horaSalida: '15:00',
      horaLlegada: addMinutesToTime(
        '15:00',
        Number(rutas[2].duracionEstimada ?? 30),
      ),
      duracionEstimada: Number(rutas[2].duracionEstimada ?? 30),
      estado: 'programada',
      bus: buses[6],
      ruta: rutas[2],
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

  console.log('✓ Programaciones seeded');
}
