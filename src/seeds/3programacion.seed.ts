import { DataSource } from 'typeorm';
import { Programacion } from '../programacion/entities/programacion.entity';
import { Bus } from '../bus/entities/bus.entity';

export async function seedProgramaciones(dataSource: DataSource) {
  const programacionRepository = dataSource.getRepository(Programacion);
  const busRepository = dataSource.getRepository(Bus);

  const buses = await busRepository.find();
  if (buses.length === 0) {
    console.warn('⚠ No buses found. Run bus.seed first');
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
      estado: 'activa',
      bus: buses[0],
    },
    {
      fecha: today,
      horaSalida: '08:30',
      estado: 'programada',
      bus: buses[0],
    },
    {
      fecha: today,
      horaSalida: '14:00',
      estado: 'activa',
      bus: buses[1],
    },
    {
      fecha: today,
      horaSalida: '16:30',
      estado: 'programada',
      bus: buses[1],
    },
    {
      fecha: tomorrow,
      horaSalida: '06:00',
      estado: 'programada',
      bus: buses[2],
    },
    {
      fecha: tomorrow,
      horaSalida: '09:00',
      estado: 'programada',
      bus: buses[2],
    },
    {
      fecha: tomorrow,
      horaSalida: '13:30',
      estado: 'programada',
      bus: buses[3],
    },
    {
      fecha: tomorrow,
      horaSalida: '17:00',
      estado: 'programada',
      bus: buses[3],
    },
    {
      fecha: dayAfter,
      horaSalida: '07:00',
      estado: 'programada',
      bus: buses[4],
    },
    {
      fecha: dayAfter,
      horaSalida: '10:30',
      estado: 'programada',
      bus: buses[5],
    },
    {
      fecha: dayAfter,
      horaSalida: '15:00',
      estado: 'programada',
      bus: buses[6],
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
