import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Direccion } from 'src/direccion/entities/direccion.entity';
import { FakerFactory } from './faker.factory';

export class CiudadanoFactory {
  static create(overrides?: Partial<Ciudadano>): Ciudadano {
    const ciudadano = new Ciudadano();
    ciudadano.nombre = FakerFactory.fullName();
    ciudadano.cedula = FakerFactory.cedula();
    ciudadano.telefono = FakerFactory.cellPhone();
    ciudadano.email = FakerFactory.email();
    ciudadano.fechaNacimiento = FakerFactory.dateOfBirth();

    return Object.assign(ciudadano, overrides);
  }

  static createMany(count: number, overrides?: Partial<Ciudadano>): Ciudadano[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
