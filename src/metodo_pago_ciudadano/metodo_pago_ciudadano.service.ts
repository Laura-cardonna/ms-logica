import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; 
import { MetodoPagoCiudadano } from './entities/metodo_pago_ciudadano.entity';
import { Historial } from '../historial/entities/historial.entity';
import { CreateMetodoPagoCiudadanoDto } from './dto/create-metodo_pago_ciudadano.dto';
import { UpdateMetodoPagoCiudadanoDto } from './dto/update-metodo_pago_ciudadano.dto';

import * as crypto from 'crypto';

@Injectable()
export class MetodoPagoCiudadanoService {
  constructor(
    @InjectRepository(MetodoPagoCiudadano)
    private readonly tarjetaRepository: Repository<MetodoPagoCiudadano>,
    private readonly dataSource: DataSource,
  ) {}

  // ==========================================
  // NUEVOS MÉTODOS: HU-ENTR-2-013 (ePayco)
  // ==========================================

  async generarReferenciaPago(ciudadanoId: string, tarjetaId: number, monto: number) {
    const tarjeta = await this.tarjetaRepository.findOne({ 
      where: { id: tarjetaId },
      relations: ['ciudadano'] 
    });

    if (!tarjeta || tarjeta.ciudadano?.id !== ciudadanoId) {
      throw new NotFoundException('Tarjeta no válida.');
    }

    const referencia = `REC-${Date.now()}-${tarjeta.id}`;

    return {
      referencia,
      monto,
      tarjetaId,
      // Usamos ! para decirle a TypeScript que estamos seguros de que id existe
      extra1: tarjeta.id!.toString(), 
      mensaje: 'Proceda con el pago en ePayco'
    };
  }

  async procesarConfirmacionEpayco(payload: any) {
    console.log('Webhook de ePayco recibido:', payload.x_ref_payco);

    const p_cust_id_cliente = process.env.EPAYCO_P_CUST_ID_CLIENTE || '';
    const p_key = process.env.EPAYCO_P_KEY || '';

    const x_ref_payco = payload.x_ref_payco;
    const x_transaction_id = payload.x_transaction_id;
    const x_amount = payload.x_amount;
    const x_currency_code = payload.x_currency_code;
    const x_signature = payload.x_signature;
    const estado_transaccion = payload.x_respuesta;
    const tarjetaId = parseInt(payload.x_extra1);

    const firmaString = `${p_cust_id_cliente}^${p_key}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`;
    const firmaCalculada = crypto.createHash('sha256').update(firmaString).digest('hex');

    if (firmaCalculada !== x_signature) {
      console.error('Firma inválida. Posible fraude.');
      throw new BadRequestException('Firma de seguridad inválida');
    }

    if (estado_transaccion === 'Aceptada' && tarjetaId) {
      const tarjeta = await this.tarjetaRepository.findOne({ where: { id: tarjetaId } });
      
      if (tarjeta) {
        const saldoActual = Number(tarjeta.saldo || 0);
        const montoRecarga = Number(x_amount);
        
        tarjeta.saldo = saldoActual + montoRecarga;
        await this.tarjetaRepository.save(tarjeta);
        
        console.log(`✅ Recarga exitosa. Tarjeta: ${tarjeta.id} | Nuevo Saldo: $${tarjeta.saldo}`);
        return { success: true, mensaje: 'Saldo recargado exitosamente' };
      }
    }

    return { success: false, mensaje: `Transacción no procesada. Estado: ${estado_transaccion}` };
  }

  // ==========================================
  // MÉTODOS CRUD (Plantilla original)
  // ==========================================

  create(createMetodoPagoCiudadanoDto: CreateMetodoPagoCiudadanoDto) {
    return this.tarjetaRepository.save(this.tarjetaRepository.create(createMetodoPagoCiudadanoDto as any));
  }

  findAll() {
    return this.tarjetaRepository.find();
  }

  findOne(id: number) {
    return this.tarjetaRepository.findOne({ where: { id } });
  }

  update(id: number, updateMetodoPagoCiudadanoDto: UpdateMetodoPagoCiudadanoDto) {
    return `This action updates a #${id} metodoPagoCiudadano`;
  }

  remove(id: number) {
    return `This action removes a #${id} metodoPagoCiudadano`;
  }
}