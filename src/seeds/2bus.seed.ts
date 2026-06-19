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
    {
      placa: 'BUS-009',
      modelo: 'Volvo B340M Biarticulado',
      capacidadMaxima: 180,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-010',
      modelo: 'Mercedes-Benz O500U',
      capacidadMaxima: 80,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-011',
      modelo: 'Scania K310 Articulado',
      capacidadMaxima: 140,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-012',
      modelo: 'BYD K9 (Eléctrico)',
      capacidadMaxima: 80,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-013',
      modelo: 'Yutong ZK6122H',
      capacidadMaxima: 53,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-014',
      modelo: 'Marcopolo Paradiso 1200',
      capacidadMaxima: 46,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-015',
      modelo: 'Chevrolet LV150',
      capacidadMaxima: 40,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-016',
      modelo: 'Mercedes-Benz Sprinter 515 (Microbus)',
      capacidadMaxima: 19,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-017',
      modelo: 'Hino AK8J',
      capacidadMaxima: 45,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-018',
      modelo: 'Volvo B12R',
      capacidadMaxima: 50,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-019',
      modelo: 'Scania K400 Double Decker',
      capacidadMaxima: 64,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-020',
      modelo: 'Foton BJ6123 (Eléctrico)',
      capacidadMaxima: 90,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-021',
      modelo: 'Agrale MT 15.0',
      capacidadMaxima: 38,
      empresa: empresaId1,
    },
    {
      placa: 'BUS-022',
      modelo: 'Hyundai County',
      capacidadMaxima: 28,
      empresa: empresaId1,
    },
    {
      calle: 'Avenida Santander',
      numero: '62-15',
      apartamento: 'Local 102',
      ciudad: 'Manizales',
      codigoPostal: '170002',
    },
    {
      calle: 'Carrera 23 (Avenida Lindsay)',
      numero: '65-05',
      apartamento: 'Torre B Apt 401',
      ciudad: 'Manizales',
      codigoPostal: '170002',
    },
    {
      calle: 'Calle 70',
      numero: '23-40',
      apartamento: 'Casa 4',
      ciudad: 'Manizales',
      codigoPostal: '170006', // Sector Palermo
    },
    {
      calle: 'Carrera 32',
      numero: '10-22',
      ciudad: 'Manizales',
      codigoPostal: '170001', // Sector Chipre
    },
    {
      calle: 'Carrera 23',
      numero: '22-04',
      apartamento: 'Oficina 301',
      ciudad: 'Manizales',
      codigoPostal: '170003', // Sector Centro
    },
    {
      calle: 'Calle 48',
      numero: '25-10',
      ciudad: 'Manizales',
      codigoPostal: '170005', // Sector Claret / Versalles
    },
    {
      calle: 'Avenida Alberto Mendoza',
      numero: '95-100',
      apartamento: 'Bodega 12',
      ciudad: 'Manizales',
      codigoPostal: '170004', // Sector Bosques de Niza
    },
    {
      calle: 'Carrera 40',
      numero: '35-18',
      ciudad: 'Manizales',
      codigoPostal: '170001', // Sector San Jorge
    },
    {
      calle: 'Calle 101',
      numero: '32-50',
      apartamento: 'Bloque 5 Apt 202',
      ciudad: 'Manizales',
      codigoPostal: '170006', // Sector La Enea
    },
    {
      calle: 'Carrera 25',
      numero: '12-05',
      ciudad: 'Manizales',
      codigoPostal: '170001', // Sector Villa Pilar
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