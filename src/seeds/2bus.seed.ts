import { DataSource } from 'typeorm';
import { Bus } from '../bus/entities/bus.entity';
import { Empresa } from '../empresa/entities/empresa.entity';

export async function seedBuses(dataSource: DataSource) {
  const busRepository = dataSource.getRepository(Bus);
  const empresaRepository = dataSource.getRepository(Empresa);

  // Buscamos específicamente la empresa con id = 1
  const empresaId1 = await empresaRepository.findOneBy({ id: 1 });
  
  if (!empresaId1) {
    console.warn('⚠ No se encontró la empresa con ID = 1. Asegúrate de correr el seed de empresas primero.');
    return;
  }

  // Ahora todos los buses apuntan a 'empresaId1'
  const buses = [
    {
      placa: 'BUS-001',
      modelo: 'Mercedes-Benz 1418',
      capacidadMaxima: 45,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-002',
      modelo: 'Scania K114',
      capacidadMaxima: 50,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-003',
      modelo: 'Volvo B420',
      capacidadMaxima: 48,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-004',
      modelo: 'Mercedes-Benz 1722',
      capacidadMaxima: 55,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-005',
      modelo: 'Scania K94',
      capacidadMaxima: 42,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-006',
      modelo: 'Volvo B270',
      capacidadMaxima: 40,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-007',
      modelo: 'Mercedes-Benz 915',
      capacidadMaxima: 35,
      empresa: empresaId1,
    },
  ];

  for (const bus of buses) {
    const existing = await busRepository.findOne({
      where: { placa: bus.placa },
    });
    if (!existing) {
      await busRepository.save(bus);
    }
  }

  console.log('✓ Buses seeded');
}