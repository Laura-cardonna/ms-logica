import { Module } from '@nestjs/common';
import { MetodoPagoCiudadanoService } from './metodo_pago_ciudadano.service';
import { MetodoPagoCiudadanoController } from './metodo_pago_ciudadano.controller';

@Module({
  controllers: [MetodoPagoCiudadanoController],
  providers: [MetodoPagoCiudadanoService],
})
export class MetodoPagoCiudadanoModule {}
