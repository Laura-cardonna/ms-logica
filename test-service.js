const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { BoletoService } = require('./dist/src/boleto/boleto.service');

async function test() {
  console.log('Initializing NestJS context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(BoletoService);
  try {
    console.log('Calling getTarjetasByUserId for Karen...');
    const res = await service.getTarjetasByUserId('bd2d8a86-e275-4bef-8261-6ab5f7594149');
    console.log('Result:', res);
  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    await app.close();
  }
}
test();
