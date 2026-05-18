import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { Bus } from './entities/bus.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import { BusScanPageService } from './presentation/bus-scan-page.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Empresa, Turno])],
  controllers: [BusController],
  providers: [BusService, BusScanPageService],
})
export class BusModule {}
