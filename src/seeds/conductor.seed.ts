import { DataSource } from 'typeorm';
import { Conductor } from '../conductor/entities/conductor.entity';

export async function seedConductores(dataSource: DataSource) {
  const conductorRepository = dataSource.getRepository(Conductor);

  const conductores = [
    {
      nombre: 'Carlos Martínez López',
      licencia: 'LIC-001-2024',
      telefono: '3001234567',
    },
    {
      nombre: 'Juan Pérez Rodríguez',
      licencia: 'LIC-002-2024',
      telefono: '3012345678',
    },
    {
      nombre: 'María González Gómez',
      licencia: 'LIC-003-2024',
      telefono: '3023456789',
    },
    {
      nombre: 'Pedro Sánchez García',
      licencia: 'LIC-004-2024',
      telefono: '3034567890',
    },
    {
      nombre: 'Ana Rodríguez Torres',
      licencia: 'LIC-005-2024',
      telefono: '3045678901',
    },
    {
      nombre: 'Luis Hernández López',
      licencia: 'LIC-006-2024',
      telefono: '3056789012',
    },
  ];

  for (const conductor of conductores) {
    const existing = await conductorRepository.findOne({
      where: { licencia: conductor.licencia },
    });
    if (!existing) {
      await conductorRepository.save(conductor);
    }
  }

  console.log('✓ Conductores seeded');
}
