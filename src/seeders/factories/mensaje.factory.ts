import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { FakerFactory } from './faker.factory';

export class MensajeFactory {
  static create(overrides?: Partial<Mensaje>): Mensaje {
    const mensaje = new Mensaje();
    mensaje.contenido = FakerFactory.message();
    mensaje.fechaEnvio = FakerFactory.date();

    return Object.assign(mensaje, overrides);
  }

  static createMany(count: number, overrides?: Partial<Mensaje>): Mensaje[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
