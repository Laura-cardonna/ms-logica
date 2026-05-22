import { DataSource } from 'typeorm';
import { Empresa } from '../empresa/entities/empresa.entity';

export async function seedEmpresas(dataSource: DataSource) {
  const empresaRepository = dataSource.getRepository(Empresa);

  const empresas = [
    {
      nombre: 'KALA', // Ahora la empresa con id = 1 será KALA
      nit: '123456789-0',
    },
    {
      nombre: 'Buses Andinos',
      nit: '987654321-0',
    },
    {
      nombre: 'Transportes del Sur',
      nit: '456789123-0',
    },
    {
      nombre: 'Rutas Expeditas',
      nit: '789123456-0',
    },
  ];

  for (const empresa of empresas) {
    const existing = await empresaRepository.findOne({
      where: { nombre: empresa.nombre },
    });
    if (!existing) {
      await empresaRepository.save(empresa);
    }
  }

  console.log('✓ Empresas seeded');
}