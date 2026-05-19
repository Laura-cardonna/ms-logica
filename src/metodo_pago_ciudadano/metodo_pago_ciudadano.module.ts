import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetodoPagoCiudadanoService } from './metodo_pago_ciudadano.service';
import { MetodoPagoCiudadanoController } from './metodo_pago_ciudadano.controller';
import { MetodoPagoCiudadano } from './entities/metodo_pago_ciudadano.entity';
import { Historial } from '../historial/entities/historial.entity'

@Module({
  // 👇 AQUÍ ES DONDE REGISTRAMOS LA ENTIDAD PARA QUE EL REPOSITORIO EXISTA
  imports: [TypeOrmModule.forFeature([MetodoPagoCiudadano, Historial])], 
  controllers: [MetodoPagoCiudadanoController],
  providers: [MetodoPagoCiudadanoService],
  exports: [MetodoPagoCiudadanoService]
})
export class MetodoPagoCiudadanoModule {}