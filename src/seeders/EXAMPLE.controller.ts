/**
 * EJEMPLO: Controlador Admin para Seeders
 * 
 * Este archivo muestra cómo integrar los seeders en tu aplicación
 * para ejecutarlos mediante endpoints HTTP (solo en desarrollo)
 * 
 * ⚠️ SEGURIDAD: Nunca expongas estos endpoints en producción
 */

import { Controller, Post, Delete, Logger, ForbiddenException } from '@nestjs/common';
import { SeederService } from './seeder.service';

/**
 * OPCIÓN 1: Controlador dedicado para seeders (RECOMENDADO)
 * 
 * Lugar: src/admin/seeders.controller.ts
 * Ruta: /admin/seeders/...
 */
@Controller('admin/seeders')
export class SeedersController {
  private logger = new Logger('SeedersController');

  constructor(private seederService: SeederService) {}

  /**
   * POST /admin/seeders/seed
   * 
   * Ejecuta todos los seeders
   * Solo disponible en desarrollo
   */
  @Post('seed')
  async seed() {
    // Seguridad: Solo en desarrollo
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        '❌ Los seeders no están permitidos en producción',
      );
    }

    this.logger.log('🌱 Iniciando seeders desde controlador...');

    try {
      await this.seederService.seed();
      return {
        status: 'success',
        message: '✅ Todos los seeders ejecutados exitosamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error en seeders:', error);
      return {
        status: 'error',
        message: `❌ Error: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * DELETE /admin/seeders/clear
   * 
   * Limpia todos los datos de las tablas
   * Solo disponible en desarrollo
   */
  @Delete('clear')
  async clearData() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        '❌ No se puede limpiar datos en producción',
      );
    }

    this.logger.warn('🗑️  Limpiando todos los datos...');

    try {
      await this.seederService.clearData();
      return {
        status: 'success',
        message: '✅ Todos los datos han sido eliminados',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error limpiando datos:', error);
      return {
        status: 'error',
        message: `❌ Error: ${error.message}`,
      };
    }
  }

  /**
   * POST /admin/seeders/reseed
   * 
   * Limpia y vuelve a sembrar (clear + seed)
   * Solo disponible en desarrollo
   */
  @Post('reseed')
  async reseed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('❌ Reseed no permitido en producción');
    }

    this.logger.warn('🔄 Iniciando reseed...');

    try {
      await this.seederService.reseed();
      return {
        status: 'success',
        message: '✅ Reseed completado exitosamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error en reseed:', error);
      return {
        status: 'error',
        message: `❌ Error: ${error.message}`,
      };
    }
  }
}

/**
 * OPCIÓN 2: Integrar en AppController
 * 
 * Si prefieres agregar estos endpoints a un controlador existente
 */

/*
import { Controller, Post, Delete } from '@nestjs/common';
import { AppService } from './app.service';
import { SeederService } from './seeders/seeder.service';

@Controller()
export class AppController {
  constructor(
    private appService: AppService,
    private seederService: SeederService,
  ) {}

  @Post('seed')
  async seed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('No permitido en producción');
    }
    await this.seederService.seed();
    return { message: 'Seeders ejecutados' };
  }

  @Delete('seed')
  async clearData() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('No permitido en producción');
    }
    await this.seederService.clearData();
    return { message: 'Datos eliminados' };
  }
}
*/

/**
 * OPCIÓN 3: Module setup
 * 
 * Agregar a tu app.module.ts
 */

/*
import { Module } from '@nestjs/common';
import { SeederModule } from './seeders/seeder.module';
import { SeedersController } from './admin/seeders.controller';

@Module({
  imports: [
    // ... otros módulos
    SeederModule,
  ],
  controllers: [SeedersController],
})
export class AppModule {}
*/

/**
 * USO VÍA HTTP
 * 
 * Una vez configurado, puedes hacer requests:
 * 
 * 1. Ejecutar seeders:
 *    POST http://localhost:3000/admin/seeders/seed
 * 
 * 2. Limpiar datos:
 *    DELETE http://localhost:3000/admin/seeders/clear
 * 
 * 3. Reseed:
 *    POST http://localhost:3000/admin/seeders/reseed
 * 
 * Con curl:
 * 
 *    curl -X POST http://localhost:3000/admin/seeders/seed
 *    curl -X DELETE http://localhost:3000/admin/seeders/clear
 *    curl -X POST http://localhost:3000/admin/seeders/reseed
 */

/**
 * SEGURIDAD - IMPORTANTE
 * 
 * ⚠️ Siempre protege estos endpoints:
 * 
 * 1. Solo en desarrollo:
 *    if (process.env.NODE_ENV === 'production') throw error;
 * 
 * 2. Requiere autenticación (en desarrollo):
 *    @UseGuards(AuthGuard('local'))
 *    @Post('seed')
 *    async seed(@Request() req) {
 *      // Solo admin
 *      if (!req.user.isAdmin) throw ForbiddenException();
 *      await this.seederService.seed();
 *    }
 * 
 * 3. Logging:
 *    Registra quién ejecutó qué y cuándo
 * 
 * 4. Rate limiting:
 *    Limita intentos de ejecución
 */

/**
 * ALTERNATIVA: CLI Standalone
 * 
 * Si prefieres no incluir endpoints, usa CLI:
 * 
 *    npm run seed              # Ejecutar todos
 *    npm run seed:clear        # Limpiar
 *    npm run seed:reseed       # Limpiar + sembrar
 * 
 * Esta es la opción recomendada para producción
 */
