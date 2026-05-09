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
      nombre: 'Maria Perez',
      cedula: '12345',
      telefono: '3001234567',
      email: 'maria@email.com',
      fechaNacimiento: new Date('1994-03-12'),
      direccion: direcciones[0],
    },
    {
      nombre: 'Juan Rodriguez',
      cedula: '67890',
      telefono: '3109876543',
      email: 'juan@email.com',
      fechaNacimiento: new Date('1991-08-22'),
      direccion: direcciones[1] ?? direcciones[0],
    },
    {
      nombre: 'Usuario Sin Saldo',
      cedula: '55555',
      telefono: '3150000000',
      email: 'pobre@email.com',
      fechaNacimiento: new Date('2000-11-05'),
      direccion: direcciones[2] ?? direcciones[0],
    },
  ];

  for (const c of ciudadanos) {
    const existing = await ciudadanoRepository.findOne({
      where: { cedula: c.cedula },
    });
    if (!existing) {
      await ciudadanoRepository.save(c);
    }
  }
  console.log('✓ Ciudadanos mínimos para pruebas creados');
}
