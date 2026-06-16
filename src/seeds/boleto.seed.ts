import { DataSource } from 'typeorm';
import { Boleto } from '../boleto/entities/boleto.entity';
import { Programacion } from '../programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from '../metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';

export async function seedBoletos(dataSource: DataSource) {
  const boletoRepository = dataSource.getRepository(Boleto);
  const programacionRepository = dataSource.getRepository(Programacion);
  const metodoPagoCiudadanoRepository =
    dataSource.getRepository(MetodoPagoCiudadano);
  const ciudadanoRepository = dataSource.getRepository(Ciudadano);

  const ciudadanos = await ciudadanoRepository.find();
  const programaciones = await programacionRepository.find({ relations: ['ruta'] });
  const metodosPagoCiudadano = await metodoPagoCiudadanoRepository.find();

  if (
    ciudadanos.length === 0 ||
    programaciones.length === 0 ||
    metodosPagoCiudadano.length === 0
  ) {
    console.warn(
      '⚠ No ciudadanos, programaciones or metodos pago ciudadano found. Run citizen, programacion and metodo-pago-ciudadano seeds first',
    );
    return;
  }

  const boletos = [
    {
      numeroBoleto: 'BOL-SEED-001',
      costo: 2500,
      inicioViaje: programaciones[0].fecha,
      estado: 'activo',
      ciudadano: ciudadanos[0],
      programacion: programaciones[0],
      metodoPagoCiudadano: metodosPagoCiudadano[0],
      ruta: programaciones[0].ruta ?? undefined,
    },
    {
      numeroBoleto: 'BOL-SEED-002',
      costo: 2500,
      inicioViaje: programaciones[0].fecha,
      finViaje: new Date(Date.now() - 2 * 60 * 60 * 1000),
      estado: 'completado',
      ciudadano: ciudadanos[1] ?? ciudadanos[0],
      programacion: programaciones[0],
      metodoPagoCiudadano: metodosPagoCiudadano[1],
      ruta: programaciones[0].ruta ?? undefined,
    },
    {
      numeroBoleto: 'BOL-SEED-003',
      costo: 2500,
      inicioViaje: programaciones[1].fecha,
      finViaje: new Date(Date.now() - 1 * 60 * 60 * 1000),
      estado: 'completado',
      ciudadano: ciudadanos[2] ?? ciudadanos[0],
      programacion: programaciones[1],
      metodoPagoCiudadano: metodosPagoCiudadano[2],
      ruta: programaciones[1].ruta ?? undefined,
    },
    {
      numeroBoleto: 'BOL-SEED-004',
      costo: 2800,
      inicioViaje: programaciones[2].fecha,
      estado: 'activo',
      ciudadano: ciudadanos[3] ?? ciudadanos[0],
      programacion: programaciones[2],
      metodoPagoCiudadano: metodosPagoCiudadano[3],
      ruta: programaciones[2].ruta ?? undefined,
    },
    {
      numeroBoleto: 'BOL-SEED-005',
      costo: 3000,
      inicioViaje: programaciones[3].fecha,
      estado: 'activo',
      ciudadano: ciudadanos[4] ?? ciudadanos[0],
      programacion: programaciones[3],
      metodoPagoCiudadano: metodosPagoCiudadano[4],
      ruta: programaciones[3].ruta ?? undefined,
    },
  ];

  let count = 0;
  for (const boleto of boletos) {
    const existing = await boletoRepository.findOne({
      where: { numeroBoleto: boleto.numeroBoleto },
    });
    if (!existing) {
      await boletoRepository.save(boleto);
      count++;
    }
  }

  if (count === 0) {
    console.log('✓ Boletos seed already existed');
    return;
  }

  console.log(`✓ Boletos seeded (${count} new)`);
}
