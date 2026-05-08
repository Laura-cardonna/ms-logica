import { DataSource } from 'typeorm';
import { MetodoPago } from 'src/metodo_pago/entities/metodo_pago.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Logger } from '@nestjs/common';
import { FakerFactory } from '../factories/faker.factory';

export class EPaycoSeeder {
  private logger = new Logger('EPaycoSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const metodoPagoRepository = dataSource.getRepository(MetodoPago);
    const metodoPagoCiudadanoRepository = dataSource.getRepository(MetodoPagoCiudadano);
    const ciudadanoRepository = dataSource.getRepository(Ciudadano);

    // Verificar si ya existen registros de ePayco
    const ePaycoMethod = await metodoPagoRepository.findOne({
      where: { nombre: 'ePayco Digital' },
    });

    if (ePaycoMethod) {
      this.logger.log('ePayco: Ya existe integración. Omitiendo seed...');
      return;
    }

    this.logger.log('Iniciando seed de integración ePayco...');

    // Crear métodos de pago
    const metodoPagos = await this.createMetodosPago(metodoPagoRepository);

    // Obtener ciudadanos
    const ciudadanos = await ciudadanoRepository.find({ take: 50 });
    if (ciudadanos.length === 0) {
      this.logger.error('No hay ciudadanos disponibles. Ejecuta el seeder de Ciudadanos primero.');
      return;
    }

    // Crear métodos de pago por ciudadano
    const metodosPagoCiudadano = await this.createMetodosPagoCiudadano(
      metodoPagoCiudadanoRepository,
      metodoPagos,
      ciudadanos,
    );

    this.logger.log(`✓ Se crearon ${metodoPagos.length} métodos de pago`);
    this.logger.log(`✓ Se crearon ${metodosPagoCiudadano.length} métodos de pago asignados a ciudadanos`);
    this.logger.log('✓ Integración ePayco configurada exitosamente');
  }

  private async createMetodosPago(repository): Promise<MetodoPago[]> {
    const metodoPagos: MetodoPago[] = [];

    // Métodos de pago principales
    const metodos = [
      {
        nombre: 'ePayco Digital',
        descripcion: 'Billetera digital ePayco para transporte',
      },
      {
        nombre: 'Tarjeta de Crédito',
        descripcion: 'Pago con tarjeta de crédito a través de ePayco',
      },
      {
        nombre: 'Tarjeta de Débito',
        descripcion: 'Pago con tarjeta de débito a través de ePayco',
      },
      {
        nombre: 'Transferencia Bancaria',
        descripcion: 'Transferencia bancaria PSE a través de ePayco',
      },
      {
        nombre: 'Efectivo',
        descripcion: 'Pago en efectivo en puntos de venta autorizados',
      },
    ];

    for (const metodo of metodos) {
      let metodoPago = await repository.findOne({
        where: { nombre: metodo.nombre },
      });

      if (!metodoPago) {
        metodoPago = repository.create(metodo);
        await repository.save(metodoPago);
      }

      metodoPagos.push(metodoPago);
    }

    return metodoPagos;
  }

  private async createMetodosPagoCiudadano(
    repository: any,
    metodoPagos: MetodoPago[],
    ciudadanos: Ciudadano[],
  ): Promise<MetodoPagoCiudadano[]> {
    const metodosPagoCiudadano: MetodoPagoCiudadano[] = [];

    // Asignar métodos de pago a ciudadanos
    for (const ciudadano of ciudadanos) {
      const numMetodos = Math.floor(Math.random() * 3) + 1; // 1-3 métodos por ciudadano
      const metodosAsignados = new Set<number>();

      while (metodosAsignados.size < numMetodos) {
        const randomIndex = Math.floor(Math.random() * metodoPagos.length);
        metodosAsignados.add(randomIndex);
      }

      for (const index of Array.from(metodosAsignados)) {
        const mpc = new MetodoPagoCiudadano();
        mpc.metodoPago = metodoPagos[index];
        mpc.ciudadano = ciudadano;
        const nombreMetodo = metodoPagos[index]?.nombre;
        mpc.instrumentoId = nombreMetodo ? this.generateInstrumentoId(nombreMetodo) : '';
        mpc.saldo = nombreMetodo ? this.generateSaldo(nombreMetodo) : 0;
        mpc.estado = 'activo';
        mpc.fechaRecarga = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

        metodosPagoCiudadano.push(mpc);
      }
    }

    await repository.save(metodosPagoCiudadano);
    return metodosPagoCiudadano;
  }

  private generateInstrumentoId(metodoPagoNombre: string): string {
    switch (metodoPagoNombre) {
      case 'ePayco Digital':
        // ID de billetera ePayco
        return `EPAYCO-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      case 'Tarjeta de Crédito':
      case 'Tarjeta de Débito':
        // Número de tarjeta (formato enmascarado)
        const lastFourDigits = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0');
        return `****-****-****-${lastFourDigits}`;
      case 'Transferencia Bancaria':
        // Número de cuenta/referencia PSE
        return `PSE-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
      case 'Efectivo':
        return `CASH-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
      default:
        return `ID-${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  private generateSaldo(metodoPagoNombre: string): number {
    if (metodoPagoNombre === 'Efectivo') {
      return 0; // El efectivo no tiene saldo
    }
    // Saldo entre 5000 y 100000
    return Math.floor(Math.random() * 95000) + 5000;
  }
}
