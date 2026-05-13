import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParaderoService } from './paradero.service';
import { ParaderoController } from './paradero.controller';
import { Paradero } from './entities/paradero.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Paradero])],
  controllers: [ParaderoController],
  providers: [ParaderoService],
  exports: [ParaderoService],
})
export class ParaderoModule {}
