import { Direccion } from 'src/direccion/entities/direccion.entity';
import { FakerFactory } from './faker.factory';

export class DireccionFactory {
  static create(overrides?: Partial<Direccion>): Direccion {
    const direccion = new Direccion();
    direccion.calle = FakerFactory.street();
    direccion.numero = String(FakerFactory.random(999, 1));
    direccion.apartamento = FakerFactory.apartment();
    direccion.ciudad = FakerFactory.city();
    direccion.codigoPostal = FakerFactory.postalCode();

    return Object.assign(direccion, overrides);
  }

  static createMany(count: number, overrides?: Partial<Direccion>): Direccion[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
