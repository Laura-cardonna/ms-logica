import { DataSource } from 'typeorm';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { MensajeFactory } from '../factories/mensaje.factory';
import { Logger } from '@nestjs/common';

export class MensajeSeeder {
  private logger = new Logger('MensajeSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Mensaje);
    const personaRepository = dataSource.getRepository(Persona);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Mensaje: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Mensajes...');

    const personas = await personaRepository.find();
    if (personas.length === 0) {
      this.logger.error('No hay personas disponibles. Ejecuta el seeder de Personas primero.');
      return;
    }

    const mensajes = MensajeFactory.createMany(200);

    // Asignar emisores (personas)
    mensajes.forEach((mensaje) => {
      const randomPersona = personas[Math.floor(Math.random() * personas.length)];
      mensaje.emisor = randomPersona;
    });

    await repository.save(mensajes);

    this.logger.log(`✓ Se crearon ${mensajes.length} mensajes`);
  }
}
