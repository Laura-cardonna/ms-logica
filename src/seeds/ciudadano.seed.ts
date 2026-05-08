import { DataSource } from 'typeorm';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';

export async function seedCiudadanos(dataSource: DataSource) {
  const ciudadanoRepository = dataSource.getRepository(Ciudadano);

  const ciudadanos = [
    {
      nombre: 'Maria Perez',
      cedula: '12345',
      telefono: '3001234567',
      email: 'maria@email.com',
    },
    {
      nombre: 'Juan Rodriguez',
      cedula: '67890',
      telefono: '3109876543',
      email: 'juan@email.com',
    },
    {
      nombre: 'Usuario Sin Saldo',
      cedula: '55555',
      telefono: '3150000000',
      email: 'pobre@email.com',
    }
  ];

  for (const c of ciudadanos) {
    const existing = await ciudadanoRepository.findOne({ where: { cedula: c.cedula } });
    if (!existing) {
      await ciudadanoRepository.save(c);
    }
  }
  console.log('✓ Ciudadanos mínimos para pruebas creados');
}