import { DataSource } from 'typeorm';
import { RutaParadero } from '../ruta_paradero/entities/ruta_paradero.entity';
import { Ruta } from '../ruta/entities/ruta.entity';
import { Paradero } from '../paradero/entities/paradero.entity';

export async function seedRutasParaderos(dataSource: DataSource) {
  const rutaParaderoRepository = dataSource.getRepository(RutaParadero);
  const rutaRepository = dataSource.getRepository(Ruta);
  const paraderoRepository = dataSource.getRepository(Paradero);

  // Obtener rutas y paraderos existentes
  const rutaCentroSur = await rutaRepository.findOne({
    where: { nombre: 'Ruta Centro - Sur' },
  });
  const rutaCentroNorte = await rutaRepository.findOne({
    where: { nombre: 'Ruta Centro - Norte' },
  });
  const paraderos = await paraderoRepository.find();

  if (!rutaCentroSur || !rutaCentroNorte || paraderos.length === 0) {
    console.log(
      '⚠ No se pueden crear rutas-paraderos sin rutas o paraderos previos',
    );
    return;
  }

  const rutasParaderos = [
    {
      ruta: rutaCentroSur,
      paradero: paraderos[0],
      ordenSecuencial: 1,
      horaLlegadaEstimada: '06:00',
    },
    {
      ruta: rutaCentroSur,
      paradero: paraderos[1],
      ordenSecuencial: 2,
      horaLlegadaEstimada: '06:15',
    },
    {
      ruta: rutaCentroSur,
      paradero: paraderos[2],
      ordenSecuencial: 3,
      horaLlegadaEstimada: '06:35',
    },
    {
      ruta: rutaCentroNorte,
      paradero: paraderos[0],
      ordenSecuencial: 1,
      horaLlegadaEstimada: '07:00',
    },
    {
      ruta: rutaCentroNorte,
      paradero: paraderos[2],
      ordenSecuencial: 2,
      horaLlegadaEstimada: '07:25',
    },
  ];

  for (const rutaParadero of rutasParaderos) {
    const existing = await rutaParaderoRepository.findOne({
      where: {
        ruta: { id: rutaParadero.ruta.id },
        paradero: { id: rutaParadero.paradero.id },
        ordenSecuencial: rutaParadero.ordenSecuencial,
      },
    });
    if (!existing) {
      await rutaParaderoRepository.save(rutaParadero);
    }
  }

  console.log('✓ Rutas-Paraderos seeded');
}
