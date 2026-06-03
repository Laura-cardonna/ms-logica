import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importante
import { PersonaService } from './persona.service';
import { PersonaController } from './persona.controller';
import { Persona } from './entities/persona.entity'; // Importante

@Module({
  imports: [
    // Esto es lo que le falta para poder inyectar el Repository
    TypeOrmModule.forFeature([Persona])
  ],
  controllers: [PersonaController],
  providers: [PersonaService],
  exports: [PersonaService] // Exportarlo por si lo necesitas en Grupos después
})
export class PersonaModule {}