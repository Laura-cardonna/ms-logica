import { DataSource } from 'typeorm';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Logger } from '@nestjs/common';

export class GrupoPersonaSeeder {
  private logger = new Logger('GrupoPersonaSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(GrupoPersona);
    const grupoRepository = dataSource.getRepository(Grupo);
    const personaRepository = dataSource.getRepository(Persona);

    // Verificar si ya existen registros
    const count = await repository.count();
    if (count > 0) {
      this.logger.log(`GrupoPersona: Ya existen ${count} registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Grupos-Personas (Analytics demográfico)...');

    const grupos = await grupoRepository.find();
    const personas = await personaRepository.find();

    if (grupos.length === 0 || personas.length === 0) {
      this.logger.error('No hay grupos o personas disponibles. Ejecuta los seeders previos primero.');
      return;
    }

    const gruposPersonas: GrupoPersona[] = [];

    // Crear relaciones: cada persona se asigna a 2-4 grupos
    personas.forEach(persona => {
      const numGrupos = Math.floor(Math.random() * 3) + 2; // 2-4 grupos
      const gruposAsignados = new Set<number>();

      while (gruposAsignados.size < numGrupos) {
        const randomGrupo = grupos[Math.floor(Math.random() * grupos.length)];
        if (randomGrupo?.id !== undefined) {
          gruposAsignados.add(randomGrupo.id);
        }
      }

      gruposAsignados.forEach(grupoId => {
        const gp = new GrupoPersona();
        gp.grupo = grupos.find(g => g.id === grupoId);
        gp.persona = persona;
        gp.fechaUnion = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
        gruposPersonas.push(gp);
      });
    });

    await repository.save(gruposPersonas);

    this.logger.log(`✓ Se crearon ${gruposPersonas.length} relaciones grupo-persona`);
  }
}
