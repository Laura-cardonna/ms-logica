import { DataSource } from 'typeorm';
import { Direccion } from '../direccion/entities/direccion.entity';

export async function seedDirecciones(dataSource: DataSource) {
  const direccionRepository = dataSource.getRepository(Direccion);

  const direcciones = [
    {
      calle: 'Carrera 5',
      numero: '22-10',
      apartamento: 'Apt 501',
      ciudad: 'Manizales',
      codigoPostal: '170001',
    },
    {
      calle: 'Avenida 19',
      numero: '45-30',
      apartamento: 'Apt 302',
      ciudad: 'Manizales',
      codigoPostal: '170002',
    },
    {
      calle: 'Calle 23',
      numero: '8-15',
      ciudad: 'Manizales',
      codigoPostal: '170003',
    },
    {
      calle: 'Carrera 7',
      numero: '20-45',
      apartamento: 'Apt 1001',
      ciudad: 'Manizales',
      codigoPostal: '170004',
    },
    {
      calle: 'Calle 19',
      numero: '5-25',
      ciudad: 'Manizales',
      codigoPostal: '170005',
    },
  ];

  for (const direccion of direcciones) {
    const existing = await direccionRepository.findOne({
      where: { calle: direccion.calle, numero: direccion.numero },
    });
    if (!existing) {
      await direccionRepository.save(direccion);
    }
  }

  console.log('✓ Direcciones seeded');
}
