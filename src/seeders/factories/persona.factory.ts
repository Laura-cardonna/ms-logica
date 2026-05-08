import { Persona } from 'src/persona/entities/persona.entity';
import { FakerFactory } from './faker.factory';

export class PersonaFactory {
  static create(overrides?: Partial<Persona>): Persona {
    const persona = new Persona();
    persona.nombre = FakerFactory.fullName();
    persona.cedula = FakerFactory.cedula();
    persona.telefono = FakerFactory.cellPhone();
    persona.email = FakerFactory.email();

    return Object.assign(persona, overrides);
  }

  static createMany(count: number, overrides?: Partial<Persona>): Persona[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
