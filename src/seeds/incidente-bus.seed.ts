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
      tipo: 'mecnico' as const,
      gravedad: 'medio' as const,
      descripcion: 'Falla en el motor del bus',
      latitud: 4.8065,
      longitud: -75.6971,
      incidente: incidentes[0],
      bus: buses[0],
    },
    {
      tipo: 'accidente' as const,
      gravedad: 'alto' as const,
      descripcion: 'Colisión menor en avenida principal',
      latitud: 4.8100,
      longitud: -75.7000,
      incidente: incidentes[1],
      bus: buses[1],
    },
    {
      tipo: 'retraso' as const,
      gravedad: 'bajo' as const,
      descripcion: 'Retraso por tráfico pesado',
      latitud: 4.8150,
      longitud: -75.6900,
      incidente: incidentes[2],
      bus: buses[2],
    },
    {
      tipo: 'mecnico' as const,
      gravedad: 'critico' as const,
      descripcion: 'Falla en frenos',
      latitud: 4.8200,
      longitud: -75.6850,
      incidente: incidentes[3],
      bus: buses[3],
    },
    {
      tipo: 'otro' as const,
      gravedad: 'medio' as const,
      descripcion: 'Problema con aire acondicionado',
      latitud: 4.8050,
      longitud: -75.7050,
      incidente: incidentes[4],
      bus: buses[4],
    },
    {
      tipo: 'retraso' as const,
      gravedad: 'bajo' as const,
      descripcion: 'Retraso por pasajeros',
      latitud: 4.8120,
      longitud: -75.6920,
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
