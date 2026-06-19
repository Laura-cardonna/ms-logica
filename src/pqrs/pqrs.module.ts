import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PqrsService } from './pqrs.service';
import { PqrsController } from './pqrs.controller';
import { PqrsEntity } from './entities/pqrs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PqrsEntity]), ConfigModule],
  controllers: [PqrsController],
  providers: [PqrsService],
  exports: [PqrsService],
})
export class PqrsModule {}