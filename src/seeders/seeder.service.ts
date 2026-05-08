import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DireccionSeeder } from './seeds/01-direccion.seeder';
import { CiudadanoSeeder } from './seeds/02-ciudadano.seeder';
import { NodoSeeder } from './seeds/03-nodo.seeder';
import { ParaderoSeeder } from './seeds/04-paradero.seeder';
import { RutaSeeder } from './seeds/05-ruta.seeder';
import { HistorialSeeder } from './seeds/06-historial.seeder';
import { PersonaSeeder } from './seeds/07-persona.seeder';
import { GrupoSeeder } from './seeds/08-grupo.seeder';
import { GrupoPersonaSeeder } from './seeds/09-grupo-persona.seeder';
import { MensajeSeeder } from './seeds/10-mensaje.seeder';
import { DestinatarioSeeder } from './seeds/11-destinatario.seeder';
import { EPaycoSeeder } from './seeds/12-epayco.seeder';

@Injectable()
export class SeederService {
  private logger = new Logger('SeederService');

  constructor(private dataSource: DataSource) {}

  async seed(): Promise<void> {
    this.logger.log('========== INICIANDO SEEDERS DE DATOS ==========');
    this.logger.log('⏱️  Tiempo de inicio: ' + new Date().toISOString());

    const startTime = Date.now();

    try {
      // Ejecutar seeders en orden de dependencias
      await this.runSeeder(new DireccionSeeder(), 'Dirección');
      await this.runSeeder(new CiudadanoSeeder(), 'Ciudadano');
      await this.runSeeder(new NodoSeeder(), 'Nodo');
      await this.runSeeder(new ParaderoSeeder(), 'Paradero');
      await this.runSeeder(new RutaSeeder(), 'Ruta');
      await this.runSeeder(new HistorialSeeder(), 'Historial');
      await this.runSeeder(new PersonaSeeder(), 'Persona');
      await this.runSeeder(new GrupoSeeder(), 'Grupo');
      await this.runSeeder(new GrupoPersonaSeeder(), 'Grupo-Persona');
      await this.runSeeder(new MensajeSeeder(), 'Mensaje');
      await this.runSeeder(new DestinatarioSeeder(), 'Destinatario');
      await this.runSeeder(new EPaycoSeeder(), 'ePayco');

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      this.logger.log('========== SEEDERS COMPLETADOS EXITOSAMENTE ==========');
      this.logger.log(`✅ Todos los seeders ejecutados sin errores`);
      this.logger.log(`⏱️  Tiempo total: ${duration}s`);
      this.logger.log(`📅 Hora de finalización: ${new Date().toISOString()}`);
    } catch (error) {
      this.logger.error('❌ Error durante la ejecución de seeders:', error);
      throw error;
    }
  }

  private async runSeeder(seeder: any, name: string): Promise<void> {
    try {
      this.logger.log(`\n🌱 Ejecutando ${name} seeder...`);
      await seeder.seed(this.dataSource);
    } catch (error) {
      this.logger.error(`Error ejecutando ${name} seeder:`, error);
      throw error;
    }
  }

  /**
   * Limpia todos los datos de las tablas (útil para development)
   * ⚠️ USAR SOLO EN DESARROLLO
   */
  async clearData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ No se puede ejecutar clearData en producción');
    }

    this.logger.warn('🗑️  LIMPIANDO TODAS LAS TABLAS (DATOS)...');

    const tables = [
      'destinatarios_grupos',
      'destinatarios_personas',
      'mensajes',
      'grupos_personas',
      'grupos',
      'historiales',
      'rutas_paraderos',
      'programaciones',
      'turnos',
      'boletos',
      'incidentes_buses',
      'incidentes',
      'gps',
      'fotos',
      'validaciones',
      'metodos_pago_ciudadano',
      'metodos_pago',
      'metodo_pago_ciudadano',
      'ciudadanos',
      'direcciones',
      'rutas',
      'paraderos',
      'nodos',
      'conductores',
      'empresas',
      'buses',
      'personas',
      'destinatarios',
    ];

    for (const table of tables) {
      try {
        await this.dataSource.query(`TRUNCATE TABLE \`${table}\` RESTART IDENTITY`);
        this.logger.debug(`✓ Limpiada tabla: ${table}`);
      } catch (error) {
        // Tabla no existe, ignorar
        this.logger.debug(`⚠️  Tabla no existe o no se pudo limpiar: ${table}`);
      }
    }

    this.logger.warn('✓ Limpieza completada');
  }

  /**
   * Reseeding: Limpia y vuelve a crear todos los datos
   * ⚠️ USAR SOLO EN DESARROLLO
   */
  async reseed(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ No se puede ejecutar reseed en producción');
    }

    this.logger.warn('🔄 INICIANDO RESEED (Limpieza + Siembra)...');
    await this.clearData();
    await this.seed();
    this.logger.log('✅ Reseed completado exitosamente');
  }
}
