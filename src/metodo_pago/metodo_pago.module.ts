import { Module } from '@nestjs/common';
import { MetodoPagoService } from './metodo_pago.service';
import { MetodoPagoController } from './metodo_pago.controller';

@Module({
  controllers: [MetodoPagoController],
  providers: [MetodoPagoService],
})
export class MetodoPagoModule {}
