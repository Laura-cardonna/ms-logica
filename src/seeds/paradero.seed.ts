import { DataSource } from 'typeorm';
import { Paradero } from '../paradero/entities/paradero.entity';

export async function seedParaderos(dataSource: DataSource) {
  const paraderoRepository = dataSource.getRepository(Paradero);

  const paraderos = [
    {
      nombre: 'Paradero Central',
      descripcion: 'Parada central para pruebas',
      latitud: 4.7110,
      longitud: -74.0721,
    },
    {
      nombre: 'Paradero Norte',
      descripcion: 'Parada norte para pruebas',
      latitud: 4.8010,
      longitud: -74.0821,
    },
    {
      nombre: 'Paradero Sur',
      descripcion: 'Parada sur para pruebas',
      latitud: 4.6210,
      longitud: -74.0621,
    },
    {
      nombre: 'Paradero Este',
      descripcion: 'Parada este para pruebas',
      latitud: 4.7310,
      longitud: -74.0221,
    },
    {
      nombre: 'Paradero Oeste',
      descripcion: 'Parada oeste para pruebas',
      latitud: 4.7110,
      longitud: -74.1221,
    },
  ];

  let count = 0;
  for (const paradero of paraderos) {
    const existing = await paraderoRepository.findOne({
      where: { nombre: paradero.nombre },
    });

    if (!existing) {
      await paraderoRepository.save(paradero);
      count++;
    }
  }

  console.log(`✓ Paraderos seeded (${count} nuevos)`);
}
