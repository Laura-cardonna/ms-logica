import { DataSource } from 'typeorm';
import { Ruta } from '../ruta/entities/ruta.entity';
import { Nodo } from '../nodo/entities/nodo.entity';

export async function seedRutas(dataSource: DataSource) {
  const rutaRepository = dataSource.getRepository(Ruta);
  const nodoRepository = dataSource.getRepository(Nodo);

  // Obtener nodos existentes
  const nodoTerminal = await nodoRepository.findOne({
    where: { nombre: 'Terminal Central Manizales' },
  });

  if (!nodoTerminal) {
    console.log('⚠ No se puede crear rutas sin el nodo terminal');
    return;
  }

  const rutas = [
    {
      nombre: 'Ruta Centro - Sur',
      descripcion: 'Ruta desde el centro hacia la zona sur de Manizales',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 35,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Centro - Norte',
      descripcion: 'Ruta desde el centro hacia la zona norte de Manizales',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 40,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Centro - Este',
      descripcion: 'Ruta desde el centro hacia la zona este de Manizales',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 30,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Circular Manizales',
      descripcion: 'Ruta circular que cubre toda la ciudad',
      tarifa: 3000,
      estado: 'activa',
      duracionEstimada: 90,
      nodo: nodoTerminal,
    },
  ];

  for (const ruta of rutas) {
    const existing = await rutaRepository.findOne({
      where: { nombre: ruta.nombre },
    });
    if (!existing) {
      await rutaRepository.save(ruta);
    }
  }

  console.log('✓ Rutas seeded');
}
