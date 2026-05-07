import { DataSource } from 'typeorm';
import { MetodoPagoCiudadano } from '../metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { MetodoPago } from '../metodo_pago/entities/metodo_pago.entity';

export async function seedMetodosPagoCiudadano(dataSource: DataSource) {
  const metodoPagoCiudadanoRepository =
    dataSource.getRepository(MetodoPagoCiudadano);
  const metodoPagoRepository = dataSource.getRepository(MetodoPago);

  const metodosPago = await metodoPagoRepository.find();
  if (metodosPago.length === 0) {
    console.warn('⚠ No métodos de pago found. Run metodo-pago.seed first');
    return;
  }

  const metodoPagoCiudadanos = [
    {
      instrumentoId: 'TC-4111111111111111',
      metodoPago: metodosPago[0], // Tarjeta de Débito
    },
    {
      instrumentoId: 'TC-5555555555554444',
      metodoPago: metodosPago[0], // Tarjeta de Débito
    },
    {
      instrumentoId: 'TC-4532012345678910',
      metodoPago: metodosPago[1], // Tarjeta de Crédito
    },
    {
      instrumentoId: 'TC-5425233010103010',
      metodoPago: metodosPago[1], // Tarjeta de Crédito
    },
    {
      instrumentoId: 'TRANS-001-2024',
      metodoPago: metodosPago[2], // Transferencia Bancaria
    },
    {
      instrumentoId: 'TRANS-002-2024',
      metodoPago: metodosPago[2], // Transferencia Bancaria
    },
    {
      instrumentoId: 'WALLET-USER-001',
      metodoPago: metodosPago[4], // Billetera Digital
    },
    {
      instrumentoId: 'WALLET-USER-002',
      metodoPago: metodosPago[4], // Billetera Digital
    },
  ];

  for (const metodoPagoCiudadano of metodoPagoCiudadanos) {
    const existing = await metodoPagoCiudadanoRepository.findOne({
      where: { instrumentoId: metodoPagoCiudadano.instrumentoId },
    });
    if (!existing) {
      await metodoPagoCiudadanoRepository.save(metodoPagoCiudadano);
    }
  }

  console.log('✓ Métodos de Pago Ciudadano seeded');
}
