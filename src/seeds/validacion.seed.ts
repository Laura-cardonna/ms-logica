import { DataSource } from 'typeorm';
import { Validacion } from '../validacion/entities/validacion.entity';
import { Boleto } from '../boleto/entities/boleto.entity';
import { Paradero } from '../paradero/entities/paradero.entity';

export async function seedValidaciones(dataSource: DataSource) {
  const validacionRepository = dataSource.getRepository(Validacion);
  const boletoRepository = dataSource.getRepository(Boleto);
  const paraderoRepository = dataSource.getRepository(Paradero);

  // Obtener boletos y paraderos existentes
  const boletos = await boletoRepository.find();
  const paraderos = await paraderoRepository.find();

  if (boletos.length === 0 || paraderos.length === 0) {
    console.log(
      '⚠ No se pueden crear validaciones sin boletos o paraderos previos',
    );
    return;
  }

  const validaciones = [
    {
      tipo: 'abordaje',
      motivo: 'Boleto válido',
      boleto: boletos[0],
      paradero: paraderos[0],
    },
    {
      tipo: 'abordaje',
      motivo: 'Boleto válido',
      boleto: boletos[1],
      paradero: paraderos[1],
    },
    {
      tipo: 'descenso',
      motivo: 'Descenso autorizado',
      boleto: boletos[0],
      paradero: paraderos[2],
    },
    {
      tipo: 'abordaje',
      motivo: 'Boleto válido',
      boleto: boletos[2],
      paradero: paraderos[0],
    },
  ];

  for (const validacion of validaciones) {
    await validacionRepository.save(validacion);
  }

  console.log('✓ Validaciones seeded');
}
