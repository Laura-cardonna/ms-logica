import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PqrsService } from './pqrs.service';
import { PqrsController } from './pqrs.controller';
import { PqrsEntity } from './entities/pqrs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PqrsEntity])],
  controllers: [PqrsController],
  providers: [PqrsService],
  exports: [PqrsService],
})
export class PqrsModule {}