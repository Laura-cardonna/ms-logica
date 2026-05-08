import { DataSource } from 'typeorm';
import { Paradero } from 'src/paradero/entities/paradero.entity';
import { Nodo } from 'src/nodo/entities/nodo.entity';
import { ParaderoFactory } from '../factories/paradero.factory';
import { Logger } from '@nestjs/common';

export class ParaderoSeeder {
  private logger = new Logger('ParaderoSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Paradero);
    const nodoRepository = dataSource.getRepository(Nodo);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Paradero: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Paraderos...');

    // Obtener nodos existentes
    const nodos = await nodoRepository.find();
    if (nodos.length === 0) {
      this.logger.error('No hay nodos disponibles. Ejecuta el seeder de Nodos primero.');
      return;
    }

    const paraderos = ParaderoFactory.createMany(80);

    // Asignar nodos y variar las coordenadas
    paraderos.forEach((paradero, index) => {
      const randomNodo = nodos[Math.floor(Math.random() * nodos.length)];
      paradero.nodo = randomNodo;
      
      // Variar coordenadas alrededor del nodo (±0.05 grados)
      const offsetLat = (Math.random() - 0.5) * 0.1;
      const offsetLon = (Math.random() - 0.5) * 0.1;
      
      if (randomNodo.latitud !== undefined && randomNodo.longitud !== undefined) {
        paradero.latitud = parseFloat((randomNodo.latitud + offsetLat).toFixed(8));
        paradero.longitud = parseFloat((randomNodo.longitud + offsetLon).toFixed(8));
      }
    });

    await repository.save(paraderos);

    this.logger.log(`✓ Se crearon ${paraderos.length} paraderos`);
  }
}
