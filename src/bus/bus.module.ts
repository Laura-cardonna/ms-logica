import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { Bus } from './entities/bus.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Empresa])],
  controllers: [BusController],
  providers: [BusService],
})
export class BusModule {}
