import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionSuscripcion } from './entities/notificacion-suscripcion.entity';
import { NotificacionSuscripcionService } from './notificacion-suscripcion.service';
import { NotificacionSuscripcionController } from './notificacion-suscripcion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificacionSuscripcion])],
  controllers: [NotificacionSuscripcionController],
  providers: [NotificacionSuscripcionService],
  exports: [NotificacionSuscripcionService],
})
export class NotificacionSuscripcionModule {}
