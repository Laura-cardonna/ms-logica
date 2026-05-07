import { DataSource } from 'typeorm';
import { Foto } from '../foto/entities/foto.entity';
import { IncidenteBus } from '../incidente_bus/entities/incidente_bus.entity';

export async function seedFotos(dataSource: DataSource) {
  const fotoRepository = dataSource.getRepository(Foto);
  const incidenteBusRepository = dataSource.getRepository(IncidenteBus);

  const incidentesBus = await incidenteBusRepository.find();
  if (incidentesBus.length === 0) {
    console.warn(
      '⚠ No incidente_bus records found. Run incidente-bus.seed first',
    );
    return;
  }

  const fotos = [
    {
      url: 'https://storage.ejemplo.com/incidentes/foto-001-damage-mirror.jpg',
      fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      incidenteBus: incidentesBus[0],
    },
    {
      url: 'https://storage.ejemplo.com/incidentes/foto-002-damage-mirror-detail.jpg',
      fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      incidenteBus: incidentesBus[0],
    },
    {
      url: 'https://storage.ejemplo.com/incidentes/foto-003-traffic-jam.jpg',
      fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      incidenteBus: incidentesBus[1],
    },
    {
      url: 'https://storage.ejemplo.com/incidentes/foto-004-brake-system.jpg',
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      incidenteBus: incidentesBus[2],
    },
    {
      url: 'https://storage.ejemplo.com/incidentes/foto-005-brake-system-detail.jpg',
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      incidenteBus: incidentesBus[2],
    },
    {
      url: 'https://storage.ejemplo.com/incidentes/foto-006-passenger-area.jpg',
      fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      incidenteBus: incidentesBus[3],
    },
    {
      url: 'https://storage.ejemplo.com/incidentes/foto-007-broken-window.jpg',
      fecha: new Date(),
      incidenteBus: incidentesBus[4],
    },
    {
      url: 'https://storage.ejemplo.com/incidentes/foto-008-broken-window-external.jpg',
      fecha: new Date(),
      incidenteBus: incidentesBus[4],
    },
  ];

  let count = 0;
  for (const foto of fotos) {
    const existing = await fotoRepository.findOne({
      where: { url: foto.url },
    });
    if (!existing) {
      await fotoRepository.save(foto);
      count++;
    }
  }

  console.log(`✓ Fotos seeded (${count} new)`);
}
