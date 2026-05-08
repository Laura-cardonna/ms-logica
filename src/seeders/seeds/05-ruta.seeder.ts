import { DataSource } from 'typeorm';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Nodo } from 'src/nodo/entities/nodo.entity';
import { RutaFactory } from '../factories/ruta.factory';
import { Logger } from '@nestjs/common';

export class RutaSeeder {
  private logger = new Logger('RutaSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Ruta);
    const nodoRepository = dataSource.getRepository(Nodo);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Ruta: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Rutas...');

    // Obtener nodos existentes
    const nodos = await nodoRepository.find();
    if (nodos.length === 0) {
      this.logger.error('No hay nodos disponibles. Ejecuta el seeder de Nodos primero.');
      return;
    }

    const rutas = RutaFactory.createMany(25);

    // Asignar nodos
    rutas.forEach((ruta) => {
      const randomNodo = nodos[Math.floor(Math.random() * nodos.length)];
      ruta.nodo = randomNodo;
    });

    await repository.save(rutas);

    this.logger.log(`✓ Se crearon ${rutas.length} rutas`);
  }
}
