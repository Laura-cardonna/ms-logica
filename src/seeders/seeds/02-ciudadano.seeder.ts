import { DataSource } from 'typeorm';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Direccion } from 'src/direccion/entities/direccion.entity';
import { CiudadanoFactory } from '../factories/ciudadano.factory';
import { Logger } from '@nestjs/common';

export class CiudadanoSeeder {
  private logger = new Logger('CiudadanoSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Ciudadano);
    const direccionRepository = dataSource.getRepository(Direccion);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`Ciudadano: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Ciudadanos...');

    // Obtener direcciones existentes
    const direcciones = await direccionRepository.find();
    if (direcciones.length === 0) {
      this.logger.error('No hay direcciones disponibles. Ejecuta el seeder de Direcciones primero.');
      return;
    }

    const ciudadanos = CiudadanoFactory.createMany(100);

    // Asignar direcciones aleatoriamente
    ciudadanos.forEach((ciudadano, index) => {
      const randomDireccion = direcciones[Math.floor(Math.random() * direcciones.length)];
      ciudadano.direccion = randomDireccion;
    });

    await repository.save(ciudadanos);

    this.logger.log(`✓ Se crearon ${ciudadanos.length} ciudadanos`);
  }
}
