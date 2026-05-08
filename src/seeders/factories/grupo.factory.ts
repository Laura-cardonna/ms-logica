import { Grupo } from 'src/grupo/entities/grupo.entity';
import { FakerFactory } from './faker.factory';

export class GrupoFactory {
  static create(overrides?: Partial<Grupo>): Grupo {
    const grupo = new Grupo();
    grupo.nombre = `Grupo ${FakerFactory.randomElement(['Administrativo', 'Técnico', 'Operativo', 'Gerencial', 'Soporte', 'Ventas', 'Marketing'])}`;
    grupo.descripcion = `Grupo de usuarios para ${grupo.nombre.toLowerCase()}`;
    grupo.fechaCreacion = FakerFactory.date(90);

    return Object.assign(grupo, overrides);
  }

  static createMany(count: number, overrides?: Partial<Grupo>): Grupo[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
