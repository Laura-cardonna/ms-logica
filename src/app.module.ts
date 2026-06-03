import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { RutaModule } from './ruta/ruta.module';
import { ParaderoModule } from './paradero/paradero.module';
import { NodoModule } from './nodo/nodo.module';
import { HistorialModule } from './historial/historial.module';
import { CiudadanoModule } from './ciudadano/ciudadano.module';
import { DireccionModule } from './direccion/direccion.module';
import { GrupoModule } from './grupo/grupo.module';
import { PersonaModule } from './persona/persona.module';
import { MensajeModule } from './mensaje/mensaje.module';
import { DestinatarioModule } from './destinatario/destinatario.module';
import { RutaParaderoModule } from './ruta_paradero/ruta_paradero.module';
import { ValidacionModule } from './validacion/validacion.module';
import { DestinatarioPersonaModule } from './destinatario_persona/destinatario_persona.module';
import { DestinatarioGrupoModule } from './destinatario_grupo/destinatario_grupo.module';
import { GrupoPersonaModule } from './grupo_persona/grupo_persona.module';
import { ReportesModule } from './reportes/reportes.module';
import { MonitoreoModule } from './monitoreo/monitoreo.module';
import { NotificacionModule } from './notificacion/notificacion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        connectorPackage: 'mysql2',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        autoLoadEntities: true,
        migrationsRun: false,
      }),
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
    RutaModule,
    ParaderoModule,
    NodoModule,
    HistorialModule,
    CiudadanoModule,
    DireccionModule,
    GrupoModule,
    PersonaModule,
    MensajeModule,
    DestinatarioModule,
    RutaParaderoModule,
    ValidacionModule,
    DestinatarioPersonaModule,
    DestinatarioGrupoModule,
    GrupoPersonaModule,
    ReportesModule,
    MonitoreoModule,
    NotificacionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
