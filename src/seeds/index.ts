import { DataSource } from 'typeorm';
import { seedEmpresas } from './1empresa.seed';
import { seedMetodosPago } from './4metodo-pago.seed';
import { seedConductores } from './conductor.seed';
import { seedBuses } from './2bus.seed';
import { seedGps } from './gps.seed';
import { seedCiudadanos } from './ciudadano.seed';
import { seedProgramaciones } from './3programacion.seed';
import { seedTurnos } from './turno.seed';
import { seedIncidentes } from './incidente.seed';
import { seedIncidentesBus } from './incidente-bus.seed';
import { seedMetodosPagoCiudadano } from './5metodo-pago-ciudadano.seed';
import { seedParaderos } from './paradero.seed';
import { seedBoletos } from './boleto.seed';
import { seedFotos } from './foto.seed';
import { seedNodos } from './nodo.seed';
import { seedDirecciones } from './direccion.seed';
import { seedPersonas } from './persona.seed';
import { seedGrupos } from './grupo.seed';
import { seedRutas } from './ruta.seed';
import { seedRutasParaderos } from './ruta-paradero.seed';
import { seedGruposPersonas } from './grupo-persona.seed';
import { seedMensajes } from './mensaje.seed';
import { seedDestinatariosPersona } from './destinatario-persona.seed';
import { seedDestinatariosGrupo } from './destinatario-grupo.seed';
import { seedHistoriales } from './historial.seed';
import { seedValidaciones } from './validacion.seed';

export async function runSeeds(dataSource: DataSource) {
  console.log('\n🌱 Starting database seeding...\n');

  try {
    // Fase 1: Entidades sin dependencias
    await seedEmpresas(dataSource);
    await seedMetodosPago(dataSource);
    await seedConductores(dataSource);
    await seedIncidentes(dataSource);
    await seedNodos(dataSource);
    await seedDirecciones(dataSource);
    await seedPersonas(dataSource);

    // Fase 2: Entidades que dependen de Fase 1
    await seedBuses(dataSource);
    await seedCiudadanos(dataSource);
    await seedParaderos(dataSource);
    await seedRutas(dataSource);
    await seedGrupos(dataSource);
    await seedMetodosPagoCiudadano(dataSource);

    // Fase 3: Entidades que dependen de Fase 2
    await seedGps(dataSource);
    await seedProgramaciones(dataSource);
    await seedTurnos(dataSource);
    await seedIncidentesBus(dataSource);
    await seedRutasParaderos(dataSource);
    await seedGruposPersonas(dataSource);

    // Fase 4: Entidades que dependen de Fase 3
    await seedBoletos(dataSource);
    await seedFotos(dataSource);
    await seedMensajes(dataSource);
    await seedHistoriales(dataSource);

    // Fase 5: Entidades que dependen de Fase 4
    await seedDestinatariosPersona(dataSource);
    await seedDestinatariosGrupo(dataSource);
    await seedValidaciones(dataSource);

    console.log('\n✅ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}
