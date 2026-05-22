import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RutaService } from './src/ruta/ruta.service';

async function test() {
  console.log('Initializing NestJS context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(RutaService);
  try {
    console.log('Calling findAll...');
    const rutas = await service.findAll();
    console.log('Rutas found:', rutas.length);

    console.log('Calling findOneWithParaderos for route 1...');
    const rutaConParaderos = await service.findOneWithParaderos(1);
    console.log('Ruta con paraderos:', JSON.stringify(rutaConParaderos, null, 2));

    console.log('Calling obtenerRecorrido for route 1...');
    const recorrido = await service.obtenerRecorrido(1);
    console.log('Recorrido:', JSON.stringify(recorrido, null, 2));

  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    await app.close();
  }
}
test();
