import { DataSource } from 'typeorm';
import { Grupo } from '../grupo/entities/grupo.entity';

export async function seedGrupos(dataSource: DataSource) {
  const grupoRepository = dataSource.getRepository(Grupo);

  const grupos = [
    {
      nombre: 'Grupo Familia 1',
      descripcion: 'Grupo de familia para comunicaciones internas',
    },
    {
      nombre: 'Grupo Trabajo',
      descripcion: 'Grupo de compañeros de trabajo',
    },
    {
      nombre: 'Grupo Amigos',
      descripcion: 'Grupo de amigos para eventos',
    },
    {
      nombre: 'Grupo Comunidad',
      descripcion: 'Grupo comunitario de Manizales',
    },
  ];

  for (const grupo of grupos) {
    const existing = await grupoRepository.findOne({
      where: { nombre: grupo.nombre },
    });
    if (!existing) {
      await grupoRepository.save(grupo);
    }
  }

  console.log('✓ Grupos seeded');
}
