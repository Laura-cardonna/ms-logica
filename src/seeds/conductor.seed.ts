import { DataSource } from 'typeorm';
import { Conductor } from '../conductor/entities/conductor.entity';

export async function seedConductores(dataSource: DataSource) {
  const conductorRepository = dataSource.getRepository(Conductor);

  const conductores = [
    {
      id: 'a3f8c721-4d9e-4b2a-8f1c-6e5d9a2b7c41',
      nombre: 'Carlos Martínez López',
      licencia: 'LIC-001-2024',
      telefono: '3001234567',
    },
    {
      id: 'b7e2d456-9c3f-4a1b-9e2d-7f6a8b3c5d92',
      nombre: 'Juan Pérez Rodríguez',
      licencia: 'LIC-002-2024',
      telefono: '3012345678',
    },
    {
      id: 'c1d9e837-5a4b-4c2d-8f3e-9a7b6c4d1e83',
      nombre: 'María González Gómez',
      licencia: 'LIC-003-2024',
      telefono: '3023456789',
    },
    {
      id: 'd4f6a298-7b5c-4d3e-9a1f-8b6c7d5e2f94',
      nombre: 'Pedro Sánchez García',
      licencia: 'LIC-004-2024',
      telefono: '3034567890',
    },
    {
      id: 'e8a3b519-6c4d-4e2f-9b3a-7c8d9e6f3a15',
      nombre: 'Ana Rodríguez Torres',
      licencia: 'LIC-005-2024',
      telefono: '3045678901',
    },
    {
      id: 'f2b7c640-8d5e-4f3a-9c1b-6d9e8f7a4b26',
      nombre: 'Luis Hernández López',
      licencia: 'LIC-006-2024',
      telefono: '3056789012',
    },
    // 👇 Tu conductora Laura perfectamente integrada con sus datos
    {
      id: 'aaee28e7-2d84-493f-ae0c-ae8ef996142d',
      nombre: 'LAURA CARDONA GOMEZ',
      licencia: 'LIC-007-2026',
      telefono: '3107654321',
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