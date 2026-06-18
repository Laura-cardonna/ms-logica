import { DataSource } from 'typeorm';
import { Gps } from '../gps/entities/gps.entity';
import { Bus } from '../bus/entities/bus.entity';

export async function seedGps(dataSource: DataSource) {
  const gpsRepository = dataSource.getRepository(Gps);
  const busRepository = dataSource.getRepository(Bus);

  const buses = await busRepository.find();
  if (buses.length === 0) {
    console.warn('⚠ No buses found. Run bus.seed first');
    return;
  }

  const gpsDevices = [
    {
      // HU-3-001: en Manizales, cerca de paraderos de "Ruta Centro - Sur" (El Cable / Cable Plaza)
      deviceCode: 'GPS-DEV-001',
      latitude: 5.054,
      longitude: -75.493,
      lastUpdate: new Date(),
      bus: buses[0],
    },
    {
      // HU-3-001: en Manizales, cerca del Paradero Fundadores (misma ruta)
      deviceCode: 'GPS-DEV-002',
      latitude: 5.067,
      longitude: -75.516,
      lastUpdate: new Date(),
      bus: buses[1],
    },
    {
      deviceCode: 'GPS-DEV-003',
      latitude: 4.6097,
      longitude: -74.0817,
      lastUpdate: new Date(),
      bus: buses[2],
    },
    {
      deviceCode: 'GPS-DEV-004',
      latitude: 4.5568,
      longitude: -74.1466,
      lastUpdate: new Date(),
      bus: buses[3],
    },
    {
      deviceCode: 'GPS-DEV-005',
      latitude: 4.8,
      longitude: -74.03,
      lastUpdate: new Date(),
      bus: buses[4],
    },
    {
      deviceCode: 'GPS-DEV-006',
      latitude: 4.65,
      longitude: -74.1,
      lastUpdate: new Date(),
      bus: buses[5],
    },
    {
      deviceCode: 'GPS-DEV-007',
      latitude: 4.72,
      longitude: -74.05,
      lastUpdate: new Date(),
      bus: buses[6],
    },
  ];

  for (const gps of gpsDevices) {
    const existing = await gpsRepository.findOne({
      where: { deviceCode: gps.deviceCode },
    });
    if (!existing) {
      await gpsRepository.save(gps);
    } else {
      // En dev, refrescamos coords a la posición de demo (idempotente)
      existing.latitude = gps.latitude;
      existing.longitude = gps.longitude;
      existing.lastUpdate = gps.lastUpdate;
      await gpsRepository.save(existing);
    }
  }

  console.log('✓ GPS devices seeded');
}
