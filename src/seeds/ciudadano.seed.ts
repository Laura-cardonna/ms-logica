import { DataSource } from 'typeorm';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';
import { Direccion } from '../direccion/entities/direccion.entity';

export async function seedCiudadanos(dataSource: DataSource) {
  const ciudadanoRepository = dataSource.getRepository(Ciudadano);
  const direccionRepository = dataSource.getRepository(Direccion);

  const direcciones = await direccionRepository.find({ order: { id: 'ASC' } });
  if (direcciones.length === 0) {
    console.warn('⚠ No direcciones found. Run direccion.seed first');
    return;
  }

  const ciudadanos = [
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Tu UUID del token va aquí
      nombre: 'Maria Perez',
      cedula: '12345',
      telefono: '3001234567',
      email: 'maria@email.com',
      fechaNacimiento: new Date('1994-03-12'),
      direccion: direcciones[0],
    },
    {
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      nombre: 'Juan Rodriguez',
      cedula: '67890',
      telefono: '3109876543',
      email: 'juan@email.com',
      fechaNacimiento: new Date('1991-08-22'),
      direccion: direcciones[1] ?? direcciones[0],
    },
    {
      id: 'e8b5f2a1-3d4c-4b6e-9f8a-1c2d3e4f5a6b',
      nombre: 'Usuario Sin Saldo',
      cedula: '55555',
      telefono: '3150000000',
      email: 'pobre@email.com',
      fechaNacimiento: new Date('2000-11-05'),
      direccion: direcciones[2] ?? direcciones[0],
    },
  ];

  for (const c of ciudadanos) {
    // Como tu "id" (Token UUID) es único, es mucho mejor validar si ya existe por el ID del token
    const existing = await ciudadanoRepository.findOne({
      where: { id: c.id },
    });
    
    if (!existing) {
      // TypeORM detectará que 'numericId' no viene en el objeto y dejará que MySQL genere el 1, 2, 3 automáticamente.
      await ciudadanoRepository.save(c);
    }
  }
  
  console.log('✓ Ciudadanos mínimos para pruebas creados');
}