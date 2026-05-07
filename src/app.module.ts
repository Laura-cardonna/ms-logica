import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmpresaModule } from './empresa/empresa.module';
import { BusModule } from './bus/bus.module';
import { GpsModule } from './gps/gps.module';
import { ConductorModule } from './conductor/conductor.module';
import { TurnoModule } from './turno/turno.module';
import { ProgramacionModule } from './programacion/programacion.module';
import { MetodoPagoModule } from './metodo_pago/metodo_pago.module';
import { MetodoPagoCiudadanoModule } from './metodo_pago_ciudadano/metodo_pago_ciudadano.module';
import { BoletoModule } from './boleto/boleto.module';
import { IncidenteModule } from './incidente/incidente.module';
import { IncidenteBusModule } from './incidente_bus/incidente_bus.module';
import { FotoModule } from './foto/foto.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      autoLoadEntities: false,
    }),
    EmpresaModule,
    BusModule,
    GpsModule,
    ConductorModule,
    TurnoModule,
    ProgramacionModule,
    MetodoPagoModule,
    MetodoPagoCiudadanoModule,
    BoletoModule,
    IncidenteModule,
    IncidenteBusModule,
    FotoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
