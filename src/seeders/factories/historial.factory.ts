import { Historial } from 'src/historial/entities/historial.entity';
import { FakerFactory } from './faker.factory';

export class HistorialFactory {
  static create(overrides?: Partial<Historial>): Historial {
    const historial = new Historial();
    historial.descripcion = FakerFactory.message();
    historial.fecha = FakerFactory.date();

    return Object.assign(historial, overrides);
  }

  static createMany(count: number, overrides?: Partial<Historial>): Historial[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
