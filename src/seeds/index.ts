import { DataSource } from 'typeorm';
import { seedEmpresas } from './1empresa.seed';
import { seedMetodosPago } from './4metodo-pago.seed';
import { seedConductores } from './conductor.seed';
import { seedBuses } from './2bus.seed';
import { seedGps } from './gps.seed';
import { seedProgramaciones } from './3programacion.seed';
import { seedTurnos } from './turno.seed';
import { seedIncidentes } from './incidente.seed';
import { seedIncidentesBus } from './incidente-bus.seed';
import { seedMetodosPagoCiudadano } from './5metodo-pago-ciudadano.seed';
import { seedBoletos } from './boleto.seed';
import { seedFotos } from './foto.seed';

export async function runSeeds(dataSource: DataSource) {
  console.log('\n🌱 Starting database seeding...\n');

  try {
    // Fase 1: Entidades sin dependencias
    await seedEmpresas(dataSource);
    await seedMetodosPago(dataSource);
    await seedConductores(dataSource);
    await seedIncidentes(dataSource);

    // Fase 2: Entidades que dependen de Fase 1
    await seedBuses(dataSource);
    await seedMetodosPagoCiudadano(dataSource);

    // Fase 3: Entidades que dependen de Fase 2
    await seedGps(dataSource);
    await seedProgramaciones(dataSource);
    await seedTurnos(dataSource);
    await seedIncidentesBus(dataSource);

    // Fase 4: Entidades que dependen de Fase 3
    await seedBoletos(dataSource);
    await seedFotos(dataSource);

    console.log('\n✅ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}
