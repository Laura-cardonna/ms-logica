import { DataSource } from 'typeorm';
import { MetodoPagoCiudadano } from '../metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { MetodoPago } from '../metodo_pago/entities/metodo_pago.entity';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';

export async function seedMetodosPagoCiudadano(dataSource: DataSource) {
  const metodoPagoCiudadanoRepository = dataSource.getRepository(MetodoPagoCiudadano);
  const metodoPagoRepository = dataSource.getRepository(MetodoPago);
  const ciudadanoRepository = dataSource.getRepository(Ciudadano);

  // 1. Buscamos a los ciudadanos específicos usando el UUID de sus tokens (los que definimos en su seed)
  const maria = await ciudadanoRepository.findOneBy({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
  const juan = await ciudadanoRepository.findOneBy({ id: '7c9e6679-7425-40de-944b-e07fc1f90ae7' });
  const sinSaldo = await ciudadanoRepository.findOneBy({ id: 'e8b5f2a1-3d4c-4b6e-9f8a-1c2d3e4f5a6b' });

  const metodosPago = await metodoPagoRepository.find();

  // Validación estricta para evitar errores en cascada
  if (!maria || !juan || !sinSaldo || metodosPago.length === 0) {
    console.warn(
      '⚠ No se encontraron los ciudadanos específicos de prueba o los métodos de pago base. Ejecuta primero los otros seeds.',
    );
    return;
  }

  // 2. Armamos los métodos de pago asegurando el dueño correcto
  const metodoPagoCiudadanos = [
    {
      identificadorInstrumento: 'TARJ-MARIA-001',
      saldo: 50000,
      estado: 'activo',
      fechaRecarga: new Date(),
      ciudadano: maria, // Vinculado a María de forma segura
      metodoPago: metodosPago[0],
    },
    {
      identificadorInstrumento: 'APP-JUAN-002',
      saldo: 15000,
      estado: 'activo',
      fechaRecarga: new Date(),
      ciudadano: juan, // Vinculado a Juan de forma segura
      metodoPago: metodosPago[1] ?? metodosPago[0],
    },
    {
      identificadorInstrumento: 'TARJ-SIN-SALDO',
      saldo: 0,
      estado: 'activo',
      fechaRecarga: new Date(),
      ciudadano: sinSaldo, // Vinculado al Usuario sin saldo
      metodoPago: metodosPago[0],
    },
    {
      identificadorInstrumento: 'TARJ-INACTIVA',
      saldo: 100000,
      estado: 'inactivo',
      fechaRecarga: new Date(),
      ciudadano: maria, // Vinculado a María de forma segura
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
      const nuevoMetodo = metodoPagoCiudadanoRepository.create(metodoPagoCiudadano);
      await metodoPagoCiudadanoRepository.save(nuevoMetodo);
      count++;
    }
  }

  console.log(`✓ Métodos de Pago Ciudadano seeded (${count} nuevos)`);
}