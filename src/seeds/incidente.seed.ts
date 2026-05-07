import { DataSource } from 'typeorm';
import { Incidente } from '../incidente/entities/incidente.entity';

export async function seedIncidentes(dataSource: DataSource) {
  const incidenteRepository = dataSource.getRepository(Incidente);

  const incidentes = [
    {
      tipo: 'Accidente leve',
      descripcion:
        'Accidente menor con daño en espejo lateral. Sin lesionados.',
      fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      tipo: 'Retraso',
      descripcion:
        'Retraso de 45 minutos por congestión vial en carrera principal.',
      fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      tipo: 'Falla mecánica',
      descripcion: 'Falla en el sistema de frenos, bus inmovilizado en ruta.',
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      tipo: 'Incidente con pasajero',
      descripcion:
        'Pasajero sufrió caída durante el recorrido. Trasladado a puesto de primeros auxilios.',
      fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      tipo: 'Daño vandalismo',
      descripcion:
        'Rotura de ventana en lateral del bus por acto de vandalismo.',
      fecha: new Date(),
    },
  ];

  for (const incidente of incidentes) {
    const existing = await incidenteRepository.findOne({
      where: {
        tipo: incidente.tipo,
        descripcion: incidente.descripcion,
      },
    });
    if (!existing) {
      await incidenteRepository.save(incidente);
    }
  }

  console.log('✓ Incidentes seeded');
}
