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
    {
      nombre: 'Paradero Monumento a los Colonizadores',
      descripcion: 'Paradero turístico en el sector de Chipre',
      latitud: 5.0751,
      longitud: -75.5298,
      nodo: nodos[4] ?? nodos[0], // Nodo Occidente si existe
    },
    {
      nombre: 'Paradero Universidad Nacional',
      descripcion: 'Paradero frente al campus central de la Universidad Nacional',
      latitud: 5.0573,
      longitud: -75.4991,
      nodo: nodos[5] ?? nodos[0], // Nodo Universitario
    },
    {
      nombre: 'Paradero Universidad de Caldas',
      descripcion: 'Paradero principal sede central Universidad de Caldas',
      latitud: 5.0560,
      longitud: -75.4950,
      nodo: nodos[5] ?? nodos[0], // Nodo Universitario
    },
    {
      nombre: 'Paradero Clínica Villapilar',
      descripcion: 'Paradero de acceso a la zona hospitalaria y residencial occidente',
      latitud: 5.0712,
      longitud: -75.5345,
      nodo: nodos[4] ?? nodos[0], // Nodo Occidente
    },
    {
      nombre: 'Paradero Parque del Agua',
      descripcion: 'Paradero intermedio conectando Avenida Santander',
      latitud: 5.0632,
      longitud: -75.5078,
      nodo: nodos[0], // Terminal / Centro
    },
    {
      nombre: 'Paradero Plaza Principal Villamaría',
      descripcion: 'Paradero central en el municipio vecino de Villamaría',
      latitud: 5.0435,
      longitud: -75.5153,
      nodo: nodos[6] ?? nodos[0], // Nodo Villamaría
    },
    {
      nombre: 'Paradero Milán',
      descripcion: 'Paradero final de la zona rosa y gastronómica',
      latitud: 5.0498,
      longitud: -75.4851,
      nodo: nodos[5] ?? nodos[0], // Nodo Universitario / Este
    },
    {
      nombre: 'Paradero Bosques del Norte',
      descripcion: 'Paradero en la comuna Ciudadela del Norte',
      latitud: 5.0851,
      longitud: -75.5012,
      nodo: nodos[2] ?? nodos[0], // Nodo Norte
    },
    {
      nombre: 'Paradero San Jorge',
      descripcion: 'Paradero sector residencial San Jorge',
      latitud: 5.0678,
      longitud: -75.5098,
      nodo: nodos[0], 
    },
    {
      nombre: 'Paradero Sena Maltería',
      descripcion: 'Paradero en la zona industrial de Manizales',
      latitud: 5.0321,
      longitud: -75.4389,
      nodo: nodos[7] ?? nodos[0], // Nodo Industrial
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
