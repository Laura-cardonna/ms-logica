import { DataSource } from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';
import { PersonaFactory } from '../factories/persona.factory';
import { Logger } from '@nestjs/common';

export class PersonaSeeder {
  private logger = new Logger('PersonaSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Persona);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Persona: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Personas...');

    const personas = PersonaFactory.createMany(80);

    await repository.save(personas);

    this.logger.log(`✓ Se crearon ${personas.length} personas`);
  }
}
