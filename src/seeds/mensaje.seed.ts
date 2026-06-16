import { DataSource } from 'typeorm';
import { Mensaje } from '../mensaje/entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';

export async function seedMensajes(dataSource: DataSource) {
  const mensajeRepository = dataSource.getRepository(Mensaje);
  const personaRepository = dataSource.getRepository(Persona);

  // Obtener personas existentes
  const personas = await personaRepository.find();

  if (personas.length === 0) {
    console.log('⚠ No se pueden crear mensajes sin personas previas');
    return;
  }

  const mensajes = [
    // --- MENSAJES ORIGINALES (Para grupos, sin receptor directo) ---
    {
      contenido: 'Hola, ¿cómo están? Recordarles que mañana hay reunión.',
      emisor: personas[0],
    },
    {
      contenido: 'Por favor, confirmar asistencia al evento del sábado.',
      emisor: personas[1],
    },
    {
      contenido: 'Se les informa que se adelanta la hora de salida a las 5 AM.',
      emisor: personas[2],
    },
    {
      contenido: 'Notificación importante sobre cambios en la ruta de transporte.',
      emisor: personas[3],
    },
    {
      contenido: 'Invitación a la cena de confraternidad del próximo viernes.',
      emisor: personas[4],
    },

    // 👇 ======================================================= 👇
    // ✨ NUEVOS MENSAJES PRIVADOS: Para probar la Bandeja 1 a 1
    // ========================================================== 👇
    {
      contenido: 'Hola, ¿cuánto falta para que llegues a mi paradero?',
      emisor: personas[0],       // Ciudadano (ejemplo)
      receptor: personas[1],     // Conductor (ejemplo)
    },
    {
      contenido: '¡Hola! Estoy a unos 5 minutos, hay un poco de tráfico.',
      emisor: personas[1],       // Conductor responde
      receptor: personas[0],     // Al Ciudadano
    },
    {
      contenido: 'Entendido, aquí te espero. ¡Gracias!',
      emisor: personas[0],       // Ciudadano confirma
      receptor: personas[1],     
    }
  ];

  for (const mensaje of mensajes) {
    await mensajeRepository.save(mensaje);
  }

  console.log('✓ Mensajes seeded con éxito (Incluyendo chats privados)');
}