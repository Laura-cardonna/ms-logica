import { DataSource } from 'typeorm';
import { Persona } from '../persona/entities/persona.entity';

export async function seedPersonas(dataSource: DataSource) {
  const personaRepository = dataSource.getRepository(Persona);

  const personas = [
    {
      nombre: 'Juan Pérez',
      cedula: '1234567890',
      telefono: '3121234567',
      email: 'juan.perez@example.com',
    },
    {
      nombre: 'María García',
      cedula: '0987654321',
      telefono: '3109876543',
      email: 'maria.garcia@example.com',
    },
    {
      nombre: 'Carlos López',
      cedula: '1122334455',
      telefono: '3105551234',
      email: 'carlos.lopez@example.com',
    },
    {
      nombre: 'Ana Martínez',
      cedula: '5544332211',
      telefono: '3115554321',
      email: 'ana.martinez@example.com',
    },
    {
      nombre: 'Pedro Rodríguez',
      cedula: '9988776655',
      telefono: '3127779999',
      email: 'pedro.rodriguez@example.com',
    },
  ];

  for (const persona of personas) {
    const existing = await personaRepository.findOne({
      where: { cedula: persona.cedula },
    });
    if (!existing) {
      await personaRepository.save(persona);
    }
  }

  console.log('✓ Personas seeded');
}
