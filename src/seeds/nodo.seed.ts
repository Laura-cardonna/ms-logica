import { DataSource } from 'typeorm';
import { Nodo } from '../nodo/entities/nodo.entity';

export async function seedNodos(dataSource: DataSource) {
  const nodoRepository = dataSource.getRepository(Nodo);

  const nodos = [
    {
      nombre: 'Terminal Central Manizales',
      latitud: 5.0658,
      longitud: -75.5159,
    },
    {
      nombre: 'Nodo Sur Manizales',
      latitud: 5.05,
      longitud: -75.52,
    },
    {
      nombre: 'Nodo Norte Manizales',
      latitud: 5.08,
      longitud: -75.51,
    },
    {
      nombre: 'Nodo Este Manizales',
      latitud: 5.07,
      longitud: -75.5,
    },
  ];

  for (const nodo of nodos) {
    const existing = await nodoRepository.findOne({
      where: { nombre: nodo.nombre },
    });
    if (!existing) {
      await nodoRepository.save(nodo);
    }
  }

  console.log('✓ Nodos seeded');
}
