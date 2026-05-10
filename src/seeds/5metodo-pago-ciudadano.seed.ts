import { DataSource } from 'typeorm';
import { MetodoPagoCiudadano } from '../metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { MetodoPago } from '../metodo_pago/entities/metodo_pago.entity';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';

export async function seedMetodosPagoCiudadano(dataSource: DataSource) {
  const metodoPagoCiudadanoRepository =
    dataSource.getRepository(MetodoPagoCiudadano);
  const metodoPagoRepository = dataSource.getRepository(MetodoPago);
  const ciudadanoRepository = dataSource.getRepository(Ciudadano);

  const ciudadanos = await ciudadanoRepository.find();
  const metodosPago = await metodoPagoRepository.find();
  if (ciudadanos.length === 0 || metodosPago.length === 0) {
    console.warn(
      '⚠ No se encontraron ciudadanos o métodos de pago base. Ejecuta primero los otros seeds.',
    );
    return;
  }

  const metodoPagoCiudadanos = [
    {
      identificadorInstrumento: 'TARJ-MARIA-001',
      saldo: 50000,
      estado: 'activo',
      fechaRecarga: new Date(),
      ciudadano: ciudadanos[0],
      metodoPago: metodosPago[0],
    },
    {
      identificadorInstrumento: 'APP-JUAN-002',
      saldo: 15000,
      estado: 'activo',
      fechaRecarga: new Date(),
      ciudadano: ciudadanos[1] ?? ciudadanos[0],
      metodoPago: metodosPago[1],
    },
    {
      identificadorInstrumento: 'TARJ-SIN-SALDO',
      saldo: 0,
      estado: 'activo',
      fechaRecarga: new Date(),
      ciudadano: ciudadanos[2] ?? ciudadanos[0],
      metodoPago: metodosPago[0],
    },
    {
      identificadorInstrumento: 'TARJ-INACTIVA',
      saldo: 100000,
      estado: 'inactivo',
      fechaRecarga: new Date(),
      ciudadano: ciudadanos[0],
      metodoPago: metodosPago[0],
    },
  ];

  let count = 0;
  for (const metodoPagoCiudadano of metodoPagoCiudadanos) {
    const existing = await metodoPagoCiudadanoRepository.findOne({
      where: {
        identificadorInstrumento: metodoPagoCiudadano.identificadorInstrumento,
      },
    });

    if (!existing) {
      const nuevoMetodo =
        metodoPagoCiudadanoRepository.create(metodoPagoCiudadano);
      await metodoPagoCiudadanoRepository.save(nuevoMetodo);
      count++;
    }
  }

  console.log(`✓ Métodos de Pago Ciudadano seeded (${count} nuevos)`);
}
