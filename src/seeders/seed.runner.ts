/**
 * Seed Runner CLI
 * 
 * Uso:
 *  npm run seed              - Ejecuta todos los seeders
 *  npm run seed:clear        - Limpia todas las tablas
 *  npm run seed:reseed       - Limpia y siembra nuevamente
 * 
 * Este script se ejecuta directamente sin levantar el servidor
 */

import 'dotenv/config';
import 'reflect-metadata';
import { register } from 'tsconfig-paths';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import dataSourceConfig from '../../typeorm.config';

register({
  baseUrl: './',
  paths: {},
});

const logger = new Logger('SeedRunner');

async function runSeed() {
  let dataSource: DataSource | undefined;

  try {
    // Inicializar conexión
    dataSource = new DataSource(dataSourceConfig as any);
    await dataSource.initialize();
    logger.log('✅ Conexión a la base de datos establecida');

    // Importar dinámicamente el servicio para evitar dependencias de módulos
    // @ts-expect-error Dynamic import at runtime
    const { DireccionSeeder } = await import('./seeds/01-direccion.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { CiudadanoSeeder } = await import('./seeds/02-ciudadano.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { NodoSeeder } = await import('./seeds/03-nodo.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { ParaderoSeeder } = await import('./seeds/04-paradero.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { RutaSeeder } = await import('./seeds/05-ruta.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { HistorialSeeder } = await import('./seeds/06-historial.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { PersonaSeeder } = await import('./seeds/07-persona.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { GrupoSeeder } = await import('./seeds/08-grupo.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { GrupoPersonaSeeder } = await import('./seeds/09-grupo-persona.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { MensajeSeeder } = await import('./seeds/10-mensaje.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { DestinatarioSeeder } = await import('./seeds/11-destinatario.seeder');
    // @ts-expect-error Dynamic import at runtime
    const { EPaycoSeeder } = await import('./seeds/12-epayco.seeder');

    logger.log('\n========== INICIANDO SEEDERS DE DATOS ==========');
    logger.log('⏱️  Tiempo de inicio: ' + new Date().toISOString());

    const startTime = Date.now();

    const seeders = [
      { seeder: new DireccionSeeder(), name: 'Dirección' },
      { seeder: new CiudadanoSeeder(), name: 'Ciudadano' },
      { seeder: new NodoSeeder(), name: 'Nodo' },
      { seeder: new ParaderoSeeder(), name: 'Paradero' },
      { seeder: new RutaSeeder(), name: 'Ruta' },
      { seeder: new HistorialSeeder(), name: 'Historial' },
      { seeder: new PersonaSeeder(), name: 'Persona' },
      { seeder: new GrupoSeeder(), name: 'Grupo' },
      { seeder: new GrupoPersonaSeeder(), name: 'Grupo-Persona' },
      { seeder: new MensajeSeeder(), name: 'Mensaje' },
      { seeder: new DestinatarioSeeder(), name: 'Destinatario' },
      { seeder: new EPaycoSeeder(), name: 'ePayco' },
    ];

    for (const { seeder, name } of seeders) {
      logger.log(`\n🌱 Ejecutando ${name} seeder...`);
      await seeder.seed(dataSource);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logger.log('\n========== SEEDERS COMPLETADOS EXITOSAMENTE ==========');
    logger.log(`✅ Todos los seeders ejecutados sin errores`);
    logger.log(`⏱️  Tiempo total: ${duration}s`);
    logger.log(`📅 Hora de finalización: ${new Date().toISOString()}\n`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante la ejecución de seeders:', error);
    process.exit(1);
  } finally {
    if (dataSource) {
      await dataSource.destroy();
    }
  }
}

runSeed();
