import { DataSource } from 'typeorm';
import { DestinatarioGrupo } from '../destinatario_grupo/entities/destinatario_grupo.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';
import { Grupo } from '../grupo/entities/grupo.entity';

export async function seedDestinatariosGrupo(dataSource: DataSource) {
  const destinatarioGrupoRepository =
    dataSource.getRepository(DestinatarioGrupo);
  const mensajeRepository = dataSource.getRepository(Mensaje);
  const grupoRepository = dataSource.getRepository(Grupo);

  // Obtener mensajes y grupos existentes
  const mensajes = await mensajeRepository.find();
  const grupos = await grupoRepository.find();

  if (mensajes.length === 0 || grupos.length === 0) {
    console.log(
      '⚠ No se pueden crear destinatarios-grupo sin mensajes o grupos previos',
    );
    return;
  }

  const destinatariosGrupo = [
    { mensaje: mensajes[0], grupo: grupos[0] },
    { mensaje: mensajes[1], grupo: grupos[1] },
    { mensaje: mensajes[2], grupo: grupos[1] },
    { mensaje: mensajes[3], grupo: grupos[2] },
    { mensaje: mensajes[4], grupo: grupos[3] },
  ];

  for (const destinatario of destinatariosGrupo) {
    await destinatarioGrupoRepository.save(destinatario);
  }

  console.log('✓ Destinatarios-Grupo seeded');
}
