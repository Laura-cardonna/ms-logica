import { DataSource } from 'typeorm';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import { GrupoFactory } from '../factories/grupo.factory';
import { Logger } from '@nestjs/common';

export class GrupoSeeder {
  private logger = new Logger('GrupoSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Grupo);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Grupo: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Grupos...');

    const grupos = GrupoFactory.createMany(12);

    await repository.save(grupos);

    this.logger.log(`✓ Se crearon ${grupos.length} grupos`);
  }
}
