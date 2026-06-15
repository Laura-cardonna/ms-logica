import { DataSource } from 'typeorm';
import { Persona } from '../persona/entities/persona.entity';

export async function seedPersonas(dataSource: DataSource) {
  const personaRepository = dataSource.getRepository(Persona);

  const personas = [
    // --- TUS 7 CONDUCTORES EXACTOS ---
    { id: 'a3f8c721-4d9e-4b2a-8f1c-6e5d9a2b7c41', nombre: 'Carlos Martínez López', cedula: 'COND-001', telefono: '3001234567', email: 'carlos@empresa.com' },
    { id: 'b7e2d456-9c3f-4a1b-9e2d-7f6a8b3c5d92', nombre: 'Juan Pérez Rodríguez', cedula: 'COND-002', telefono: '3012345678', email: 'juan@empresa.com' },
    { id: 'c1d9e837-5a4b-4c2d-8f3e-9a7b6c4d1e83', nombre: 'María González Gómez', cedula: 'COND-003', telefono: '3023456789', email: 'maria@empresa.com' },
    { id: 'd4f6a298-7b5c-4d3e-9a1f-8b6c7d5e2f94', nombre: 'Pedro Sánchez García', cedula: 'COND-004', telefono: '3034567890', email: 'pedro@empresa.com' },
    { id: 'e8a3b519-6c4d-4e2f-9b3a-7c8d9e6f3a15', nombre: 'Ana Rodríguez Torres', cedula: 'COND-005', telefono: '3045678901', email: 'ana@empresa.com' },
    { id: 'f2b7c640-8d5e-4f3a-9c1b-6d9e8f7a4b26', nombre: 'Luis Hernández López', cedula: 'COND-006', telefono: '3056789012', email: 'luis@empresa.com' },
    { id: 'aaee28e7-2d84-493f-ae0c-ae8ef996142d', nombre: 'LAURA CARDONA GOMEZ', cedula: 'COND-007', telefono: '3107654321', email: 'laura@empresa.com' },

    // --- TUS 3 CIUDADANOS EXACTOS ---
    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', nombre: 'Maria Perez', cedula: '12345', telefono: '3001234567', email: 'maria@email.com' },
    { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', nombre: 'Juan Rodriguez', cedula: '67890', telefono: '3109876543', email: 'juan@email.com' },
    { id: 'e8b5f2a1-3d4c-4b6e-9f8a-1c2d3e4f5a6b', nombre: 'Usuario Sin Saldo', cedula: '55555', telefono: '3150000000', email: 'pobre@email.com' },
  ];

  for (const p of personas) {
    const existing = await personaRepository.findOne({ where: { id: p.id } });
    if (!existing) {
      await personaRepository.save(p);
    }
  }

  console.log('✓ Personas seeded exitosamente');
}