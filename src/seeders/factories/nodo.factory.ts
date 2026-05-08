import { Nodo } from 'src/nodo/entities/nodo.entity';
import { FakerFactory } from './faker.factory';

export class NodoFactory {
  static create(overrides?: Partial<Nodo>): Nodo {
    const nodo = new Nodo();
    nodo.nombre = FakerFactory.city();
    const coords = FakerFactory.coordinates();
    nodo.latitud = coords.latitude;
    nodo.longitud = coords.longitude;

    return Object.assign(nodo, overrides);
  }

  static createMany(count: number, overrides?: Partial<Nodo>): Nodo[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
