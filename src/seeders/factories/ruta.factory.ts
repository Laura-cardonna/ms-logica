import { Ruta } from 'src/ruta/entities/ruta.entity';
import { FakerFactory } from './faker.factory';

export class RutaFactory {
  static create(overrides?: Partial<Ruta>): Ruta {
    const ruta = new Ruta();
    ruta.nombre = FakerFactory.routeName();
    ruta.descripcion = `Ruta urbana con múltiples paradas y conexiones`;
    ruta.tarifa = FakerFactory.tariff();
    ruta.estado = FakerFactory.status();
    ruta.duracionEstimada = FakerFactory.duration();

    return Object.assign(ruta, overrides);
  }

  static createMany(count: number, overrides?: Partial<Ruta>): Ruta[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
