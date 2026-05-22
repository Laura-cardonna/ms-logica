import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';

import { Gps } from './entities/gps.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gps])],
  controllers: [GpsController],
  providers: [GpsService],
})
export class GpsModule {}