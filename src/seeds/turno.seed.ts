import { DataSource } from 'typeorm';
import { Turno } from '../turno/entities/turno.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Conductor } from '../conductor/entities/conductor.entity';

export async function seedTurnos(dataSource: DataSource) {
  const turnoRepository = dataSource.getRepository(Turno);
  const busRepository = dataSource.getRepository(Bus);
  const conductorRepository = dataSource.getRepository(Conductor);

  const buses = await busRepository.find();
  const conductores = await conductorRepository.find();

  if (buses.length === 0 || conductores.length === 0) {
    console.warn(
      '⚠ No buses or conductores found. Run bus.seed and conductor.seed first',
    );
    return;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const turnos = [
    {
      fecha: today,
      horaInicio: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        6,
        0,
      ),
      horaFin: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        14,
        0,
      ),
      estado: 'completado',
      conductor: conductores[0],
      bus: buses[0],
    },
    {
      fecha: today,
      horaInicio: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        14,
        0,
      ),
      horaFin: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        22,
        0,
      ),
      estado: 'completado',
      conductor: conductores[1],
      bus: buses[1],
    },
    {
      fecha: today,
      horaInicio: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        6,
        30,
      ),
      horaFin: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        14,
        30,
      ),
      estado: 'completado', // Cambiado de 'en_curso' a 'completado'
      conductor: conductores[2],
      bus: buses[2],
    },
    {
      fecha: tomorrow,
      horaInicio: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        5,
        30,
      ),
      horaFin: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        13,
        30,
      ),
      estado: 'completado', // Cambiado de 'programado' a 'completado'
      conductor: conductores[3],
      bus: buses[3],
    },
    {
      fecha: tomorrow,
      horaInicio: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        14,
        0,
      ),
      horaFin: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        22,
        0,
      ),
      estado: 'completado', // Cambiado de 'programado' a 'completado'
      conductor: conductores[4],
      bus: buses[4],
    },
  ];

  for (const turno of turnos) {
    const existing = await turnoRepository.findOne({
      where: {
        fecha: turno.fecha,
        conductor: { id: turno.conductor.id },
      },
    });
    if (!existing) {
      await turnoRepository.save(turno);
    }
  }

  console.log('✓ 5 Turnos completados seeded');
}