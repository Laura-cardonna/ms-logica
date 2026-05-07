import { DataSource } from 'typeorm';
import { IncidenteBus } from '../incidente_bus/entities/incidente_bus.entity';
import { Incidente } from '../incidente/entities/incidente.entity';
import { Bus } from '../bus/entities/bus.entity';

export async function seedIncidentesBus(dataSource: DataSource) {
  const incidenteBusRepository = dataSource.getRepository(IncidenteBus);
  const incidenteRepository = dataSource.getRepository(Incidente);
  const busRepository = dataSource.getRepository(Bus);

  const incidentes = await incidenteRepository.find();
  const buses = await busRepository.find();

  if (incidentes.length === 0 || buses.length === 0) {
    console.warn(
      '⚠ No incidentes or buses found. Run incidente.seed and bus.seed first',
    );
    return;
  }

  const incidentesBus = [
    {
      incidente: incidentes[0],
      bus: buses[0],
    },
    {
      incidente: incidentes[1],
      bus: buses[1],
    },
    {
      incidente: incidentes[2],
      bus: buses[2],
    },
    {
      incidente: incidentes[3],
      bus: buses[3],
    },
    {
      incidente: incidentes[4],
      bus: buses[4],
    },
    {
      incidente: incidentes[0],
      bus: buses[5],
    },
  ];

  for (const incidenteBus of incidentesBus) {
    const existing = await incidenteBusRepository.findOne({
      where: {
        incidente: { id: incidenteBus.incidente.id },
        bus: { id: incidenteBus.bus.id },
      },
    });
    if (!existing) {
      await incidenteBusRepository.save(incidenteBus);
    }
  }

  console.log('✓ IncidentesBus seeded');
}
