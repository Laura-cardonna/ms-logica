import { DataSource } from 'typeorm';
import { MetodoPago } from '../metodo_pago/entities/metodo_pago.entity';

export async function seedMetodosPago(dataSource: DataSource) {
  const metodoPagoRepository = dataSource.getRepository(MetodoPago);

  const metodosPago = [
    {
      nombre: 'Tarjeta de Débito',
      descripcion: 'Pago con tarjeta de débito bancaria',
    },
    {
      nombre: 'Tarjeta de Crédito',
      descripcion: 'Pago con tarjeta de crédito',
    },
    {
      nombre: 'Transferencia Bancaria',
      descripcion: 'Pago mediante transferencia bancaria',
    },
    {
      nombre: 'Efectivo',
      descripcion: 'Pago en efectivo en terminal',
    },
    {
      nombre: 'Billetera Digital',
      descripcion: 'Pago mediante aplicación móvil',
    },
  ];

  for (const metodo of metodosPago) {
    const existing = await metodoPagoRepository.findOne({
      where: { nombre: metodo.nombre },
    });
    if (!existing) {
      await metodoPagoRepository.save(metodo);
    }
  }

  console.log('✓ Métodos de Pago seeded');
}
