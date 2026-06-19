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
    {
      nombre: 'Nodo Occidente (Chipre/Villa Pilar)',
      latitud: 5.0745,
      longitud: -75.5281,
    },
    {
      nombre: 'Nodo Universitario (Palermo/Cable)',
      latitud: 5.0560,
      longitud: -75.4950,
    },
    {
      nombre: 'Nodo Villamaría',
      latitud: 5.0435,
      longitud: -75.5153,
    },
    {
      nombre: 'Nodo Industrial (Maltería)',
      latitud: 5.0321,
      longitud: -75.4389,
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
