import { DataSource } from 'typeorm';
import { Bus } from '../bus/entities/bus.entity';
import { Empresa } from '../empresa/entities/empresa.entity';

export async function seedBuses(dataSource: DataSource) {
  const busRepository = dataSource.getRepository(Bus);
  const empresaRepository = dataSource.getRepository(Empresa);

  const empresas = await empresaRepository.find();
  if (empresas.length === 0) {
    console.warn('⚠ No empresas found. Run empresa.seed first');
    return;
  }

  const buses = [
    {
      placa: 'BUS-001',
      modelo: 'Mercedes-Benz 1418',
      capacidadMaxima: 45,
      empresa: empresas[0],
    },
    {
      placa: 'BUS-002',
      modelo: 'Scania K114',
      capacidadMaxima: 50,
      empresa: empresas[0],
    },
    {
      placa: 'BUS-003',
      modelo: 'Volvo B420',
      capacidadMaxima: 48,
      empresa: empresas[1],
    },
    {
      placa: 'BUS-004',
      modelo: 'Mercedes-Benz 1722',
      capacidadMaxima: 55,
      empresa: empresas[1],
    },
    {
      placa: 'BUS-005',
      modelo: 'Scania K94',
      capacidadMaxima: 42,
      empresa: empresas[2],
    },
    {
      placa: 'BUS-006',
      modelo: 'Volvo B270',
      capacidadMaxima: 40,
      empresa: empresas[2],
    },
    {
      placa: 'BUS-007',
      modelo: 'Mercedes-Benz 915',
      capacidadMaxima: 35,
      empresa: empresas[3],
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
