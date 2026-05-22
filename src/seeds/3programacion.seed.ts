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
      fecha: today,
      horaSalida: '06:00',
      horaLlegada: addMinutesToTime(
        '06:00',
        Number(rutas[0].duracionEstimada ?? 35),
      ),
      duracionEstimada: Number(rutas[0].duracionEstimada ?? 35),
      estado: 'programada',
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
      estado: 'programada',
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