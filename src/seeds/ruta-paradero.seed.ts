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
  const rutaCentroEste = await rutaRepository.findOne({
    where: { nombre: 'Ruta Centro - Este' },
  });
  const rutaCircular = await rutaRepository.findOne({
    where: { nombre: 'Ruta Circular Manizales' },
  });
  const paraderos = await paraderoRepository.find();

  if (!rutaCentroSur || !rutaCentroNorte || paraderos.length < 3) {
    console.log(
      '⚠ No se pueden crear rutas-paraderos. Verifica que existan las rutas y al menos 3 paraderos creados.',
    );
    return;
  }

  const rutasParaderos = [
    {
      ruta: rutaCentroSur,
      paradero: paraderos[0],
      ordenSecuencial: 1,
      distanciaDesdeAnteriorMetros: 0,
      tiempoDesdeAnteriorMinutos: 0,
    },
    {
      ruta: rutaCentroSur,
      paradero: paraderos[1],
      ordenSecuencial: 2,
      distanciaDesdeAnteriorMetros: 1500,
      tiempoDesdeAnteriorMinutos: 15,
    },
    {
      ruta: rutaCentroSur,
      paradero: paraderos[2],
      ordenSecuencial: 3,
      distanciaDesdeAnteriorMetros: 2000,
      tiempoDesdeAnteriorMinutos: 20,
    },
    {
      ruta: rutaCentroNorte,
      paradero: paraderos[0],
      ordenSecuencial: 1,
      distanciaDesdeAnteriorMetros: 0,
      tiempoDesdeAnteriorMinutos: 0,
    },
    {
      ruta: rutaCentroNorte,
      paradero: paraderos[2],
      ordenSecuencial: 2,
      distanciaDesdeAnteriorMetros: 2500,
      tiempoDesdeAnteriorMinutos: 25,
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
