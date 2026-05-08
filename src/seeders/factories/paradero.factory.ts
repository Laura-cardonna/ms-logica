import { Paradero } from 'src/paradero/entities/paradero.entity';
import { FakerFactory } from './faker.factory';

export class ParaderoFactory {
  static create(overrides?: Partial<Paradero>): Paradero {
    const paradero = new Paradero();
    paradero.nombre = FakerFactory.stopName();
    paradero.descripcion = `Paradero de transporte en zona urbana`;
    const coords = FakerFactory.coordinates();
    paradero.latitud = coords.latitude;
    paradero.longitud = coords.longitude;

    return Object.assign(paradero, overrides);
  }

  static createMany(count: number, overrides?: Partial<Paradero>): Paradero[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
