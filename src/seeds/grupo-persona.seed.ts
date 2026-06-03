import { DataSource } from 'typeorm';
import { GrupoPersona } from '../grupo_persona/entities/grupo_persona.entity';
import { Grupo } from '../grupo/entities/grupo.entity';
import { Persona } from '../persona/entities/persona.entity';

export async function seedGruposPersonas(dataSource: DataSource) {
  const grupoPersonaRepository = dataSource.getRepository(GrupoPersona);
  const grupoRepository = dataSource.getRepository(Grupo);
  const personaRepository = dataSource.getRepository(Persona);

  // Obtener grupos y personas existentes
  const grupos = await grupoRepository.find();
  const personas = await personaRepository.find();

  if (grupos.length === 0 || personas.length === 0) {
    console.log(
      '⚠ No se pueden crear grupos-personas sin grupos o personas previos',
    );
    return;
  }

  const gruposPersonas = [
    { grupo: grupos[0], persona: personas[0] },
    { grupo: grupos[0], persona: personas[1] },
    { grupo: grupos[1], persona: personas[1] },
    { grupo: grupos[1], persona: personas[2] },
    { grupo: grupos[2], persona: personas[2] },
    { grupo: grupos[2], persona: personas[3] },
    { grupo: grupos[3], persona: personas[0] },
    { grupo: grupos[3], persona: personas[4] },
  ];

  for (const grupoPersona of gruposPersonas) {
    const existing = await grupoPersonaRepository.findOne({
      where: {
        grupo: { id: grupoPersona.grupo.id },
        persona: { id: grupoPersona.persona.id },
      },
    });
    if (!existing) {
      await grupoPersonaRepository.save(grupoPersona);
    }
  }

  console.log('✓ Grupos-Personas seeded');
}
