import { DataSource } from 'typeorm';
import { Paradero } from '../paradero/entities/paradero.entity';
import { Nodo } from '../nodo/entities/nodo.entity';

export async function seedParaderos(dataSource: DataSource) {
  const paraderoRepository = dataSource.getRepository(Paradero);
  const nodoRepository = dataSource.getRepository(Nodo);

  const nodos = await nodoRepository.find({ order: { id: 'ASC' } });

  if (nodos.length === 0) {
    console.warn('⚠ No nodos found. Run nodo.seed first');
    return;
  }

  const paraderos = [
    {
      nombre: 'Paradero Cable Plaza',
      descripcion: 'Paradero principal cerca del sector Cable Plaza',
      latitud: 5.0526,
      longitud: -75.4923,
      nodo: nodos[0],
    },
    {
      nombre: 'Paradero Fundadores',
      descripcion: 'Paradero del sector Fundadores en Manizales',
      latitud: 5.0682,
      longitud: -75.5174,
      nodo: nodos[1] ?? nodos[0],
    },
    {
      nombre: 'Paradero El Cable',
      descripcion: 'Paradero en la zona universitaria de El Cable',
      latitud: 5.0548,
      longitud: -75.4937,
      nodo: nodos[2] ?? nodos[0],
    },
    {
      nombre: 'Paradero Centro Histórico',
      descripcion: 'Paradero céntrico próximo a Plaza de Bolívar',
      latitud: 5.0703,
      longitud: -75.5138,
      nodo: nodos[3] ?? nodos[0],
    },
    {
      nombre: 'Paradero La Enea',
      descripcion: 'Paradero del sector La Enea',
      latitud: 5.0417,
      longitud: -75.5072,
      nodo: nodos[1] ?? nodos[0],
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
