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
    {
      nombre: 'Ruta Centro - Chipre',
      descripcion: 'Ruta turística y residencial hacia el sector de Chipre',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 20,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Universitaria (Palermo - Milan)',
      descripcion: 'Conecta la zona rosa y los principales campus universitarios',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 45,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Avenida Santander - La Enea',
      descripcion: 'Corredor principal desde el centro hasta la zona industrial y aeropuerto',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 50,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Centro - Villa Pilar',
      descripcion: 'Ruta de acceso al sector occidental de la ciudad',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 25,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Comuna Ciudadela del Norte',
      descripcion: 'Servicio directo hacia los barrios del sector norte profundo (Bosques del Norte)',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 55,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Intermunicipal Manizales - Villamaría',
      descripcion: 'Conexión rápida entre el Terminal Central y el municipio vecino de Villamaría',
      tarifa: 2800,
      estado: 'activa',
      duracionEstimada: 30,
      nodo: nodoTerminal,
    },
    {
      nombre: 'Ruta Expresa Cable Aéreo - Centro',
      descripcion: 'Línea de refuerzo para horas pico integrada visualmente al sistema de cable',
      tarifa: 2500,
      estado: 'activa',
      duracionEstimada: 15,
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
