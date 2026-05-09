import { DataSource } from 'typeorm';
import { DestinatarioPersona } from '../destinatario_persona/entities/destinatario_persona.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';

export async function seedDestinatariosPersona(dataSource: DataSource) {
  const destinatarioPersonaRepository =
    dataSource.getRepository(DestinatarioPersona);
  const mensajeRepository = dataSource.getRepository(Mensaje);
  const personaRepository = dataSource.getRepository(Persona);

  // Obtener mensajes y personas existentes
  const mensajes = await mensajeRepository.find();
  const personas = await personaRepository.find();

  if (mensajes.length === 0 || personas.length === 0) {
    console.log(
      '⚠ No se pueden crear destinatarios-persona sin mensajes o personas previos',
    );
    return;
  }

  const destinatariosPersona = [
    { mensaje: mensajes[0], persona: personas[1] },
    { mensaje: mensajes[0], persona: personas[2] },
    { mensaje: mensajes[1], persona: personas[0] },
    { mensaje: mensajes[1], persona: personas[3] },
    { mensaje: mensajes[2], persona: personas[1] },
    { mensaje: mensajes[2], persona: personas[4] },
    { mensaje: mensajes[3], persona: personas[0] },
    { mensaje: mensajes[3], persona: personas[2] },
    { mensaje: mensajes[4], persona: personas[1] },
    { mensaje: mensajes[4], persona: personas[3] },
  ];

  for (const destinatario of destinatariosPersona) {
    await destinatarioPersonaRepository.save(destinatario);
  }

  console.log('✓ Destinatarios-Persona seeded');
}
