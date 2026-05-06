import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Validacion } from './entities/validacion.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Validacion])],
    controllers: [],
    providers: [],
    exports: [TypeOrmModule],
})
export class ValidacionModule {}
