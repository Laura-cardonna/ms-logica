import { DataSource } from 'typeorm';
import { Boleto } from '../boleto/entities/boleto.entity';
import { Programacion } from '../programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from '../metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';

export async function seedBoletos(dataSource: DataSource) {
  const boletoRepository = dataSource.getRepository(Boleto);
  const programacionRepository = dataSource.getRepository(Programacion);
  const metodoPagoCiudadanoRepository =
    dataSource.getRepository(MetodoPagoCiudadano);

  const programaciones = await programacionRepository.find();
  const metodosPagoCiudadano = await metodoPagoCiudadanoRepository.find();

  if (programaciones.length === 0 || metodosPagoCiudadano.length === 0) {
    console.warn(
      '⚠ No programaciones or metodos pago ciudadano found. Run programacion.seed and metodo-pago-ciudadano.seed first',
    );
    return;
  }

  const boletos = [
    {
      costo: 2500,
      inicioViaje: programaciones[0].fecha,
      programacion: programaciones[0],
      metodoPagoCiudadano: metodosPagoCiudadano[0],
    },
    {
      costo: 2500,
      inicioViaje: programaciones[0].fecha,
      finViaje: new Date(Date.now() - 2 * 60 * 60 * 1000),
      programacion: programaciones[0],
      metodoPagoCiudadano: metodosPagoCiudadano[1],
    },
    {
      costo: 2500,
      inicioViaje: programaciones[1].fecha,
      finViaje: new Date(Date.now() - 1 * 60 * 60 * 1000),
      programacion: programaciones[1],
      metodoPagoCiudadano: metodosPagoCiudadano[2],
    },
    {
      costo: 2800,
      inicioViaje: programaciones[2].fecha,
      programacion: programaciones[2],
      metodoPagoCiudadano: metodosPagoCiudadano[3],
    },
    {
      costo: 3000,
      inicioViaje: programaciones[3].fecha,
      programacion: programaciones[3],
      metodoPagoCiudadano: metodosPagoCiudadano[4],
    },
    {
      costo: 2800,
      inicioViaje: programaciones[4].fecha,
      programacion: programaciones[4],
      metodoPagoCiudadano: metodosPagoCiudadano[5],
    },
    {
      costo: 2500,
      inicioViaje: programaciones[5].fecha,
      programacion: programaciones[5],
      metodoPagoCiudadano: metodosPagoCiudadano[6],
    },
    {
      costo: 3200,
      inicioViaje: programaciones[6].fecha,
      programacion: programaciones[6],
      metodoPagoCiudadano: metodosPagoCiudadano[7],
    },
  ];

  let count = 0;
  for (const boleto of boletos) {
    const existing = await boletoRepository.findOne({
      where: {
        inicioViaje: boleto.inicioViaje,
        programacion: { id: boleto.programacion.id },
      },
    });
    if (!existing) {
      await boletoRepository.save(boleto);
      count++;
    }
  }

  console.log(`✓ Boletos seeded (${count} new)`);
}
