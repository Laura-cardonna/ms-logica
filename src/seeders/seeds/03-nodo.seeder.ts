import { DataSource } from 'typeorm';
import { Nodo } from 'src/nodo/entities/nodo.entity';
import { NodoFactory } from '../factories/nodo.factory';
import { Logger } from '@nestjs/common';

export class NodoSeeder {
  private logger = new Logger('NodoSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Nodo);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Nodo: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Nodos...');

    // Crear nodos principales de ciudades
    const ciudadesNodos = [
      { nombre: 'Bogotá Centro', latitud: 4.71, longitud: -74.01 },
      { nombre: 'Bogotá Norte', latitud: 4.82, longitud: -74.05 },
      { nombre: 'Bogotá Sur', latitud: 4.65, longitud: -74.08 },
      { nombre: 'Bogotá Occidente', latitud: 4.70, longitud: -74.15 },
      { nombre: 'Bogotá Oriente', latitud: 4.70, longitud: -73.95 },
    ];

    const nodos = ciudadesNodos.map(data => {
      const nodo = new Nodo();
      nodo.nombre = data.nombre;
      nodo.latitud = parseFloat(data.latitud.toFixed(8));
      nodo.longitud = parseFloat(data.longitud.toFixed(8));
      return nodo;
    });

    // Agregar nodos adicionales aleatorios
    const nodosAdicionales = NodoFactory.createMany(10);
    nodos.push(...nodosAdicionales);

    await repository.save(nodos);

    this.logger.log(`✓ Se crearon ${nodos.length} nodos`);
  }
}
