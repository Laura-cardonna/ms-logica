import { DataSource } from 'typeorm';
import { Historial } from 'src/historial/entities/historial.entity';
import { Nodo } from 'src/nodo/entities/nodo.entity';
import { HistorialFactory } from '../factories/historial.factory';
import { Logger } from '@nestjs/common';

export class HistorialSeeder {
  private logger = new Logger('HistorialSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Historial);
    const nodoRepository = dataSource.getRepository(Nodo);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Historial: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Historiales...');

    // Obtener nodos existentes
    const nodos = await nodoRepository.find();
    if (nodos.length === 0) {
      this.logger.error('No hay nodos disponibles. Ejecuta el seeder de Nodos primero.');
      return;
    }

    const historiales = HistorialFactory.createMany(150);

    // Asignar nodos
    historiales.forEach((historial) => {
      const randomNodo = nodos[Math.floor(Math.random() * nodos.length)];
      historial.nodo = randomNodo;
    });

    await repository.save(historiales);

    this.logger.log(`✓ Se crearon ${historiales.length} historiales`);
  }
}
