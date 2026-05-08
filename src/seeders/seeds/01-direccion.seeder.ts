import { DataSource } from 'typeorm';
import { Direccion } from 'src/direccion/entities/direccion.entity';
import { DireccionFactory } from '../factories/direccion.factory';
import { Logger } from '@nestjs/common';

export class DireccionSeeder {
  private logger = new Logger('DireccionSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Direccion);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Dirección: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Direcciones...');

    const direcciones = DireccionFactory.createMany(50);

    await repository.save(direcciones);

    this.logger.log(`✓ Se crearon ${direcciones.length} direcciones`);
  }
}
