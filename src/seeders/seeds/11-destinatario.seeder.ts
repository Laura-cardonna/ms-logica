import { DataSource } from 'typeorm';
import { DestinatarioPersona } from 'src/destinatario_persona/entities/destinatario_persona.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import { Logger } from '@nestjs/common';

export class DestinatarioSeeder {
  private logger = new Logger('DestinatarioSeeder');

  async seed(dataSource: DataSource): Promise<void> {
    const destinatarioPersonaRepository = dataSource.getRepository(DestinatarioPersona);
    const destinatarioGrupoRepository = dataSource.getRepository(DestinatarioGrupo);
    const mensajeRepository = dataSource.getRepository(Mensaje);
    const personaRepository = dataSource.getRepository(Persona);
    const grupoRepository = dataSource.getRepository(Grupo);

    // Verificar si ya existen registros
    const countPersonas = await destinatarioPersonaRepository.count();
    const countGrupos = await destinatarioGrupoRepository.count();

    if (countPersonas > 0 || countGrupos > 0) {
      this.logger.log(`Destinatario: Ya existen registros. Omitiendo seed...`);
      return;
    }

    this.logger.log('Iniciando seed de Destinatarios (Personas y Grupos)...');

    const mensajes = await mensajeRepository.find();
    const personas = await personaRepository.find();
    const grupos = await grupoRepository.find();

    if (mensajes.length === 0 || personas.length === 0 || grupos.length === 0) {
      this.logger.error('No hay mensajes, personas o grupos disponibles.');
      return;
    }

    const destinatariosPersona: DestinatarioPersona[] = [];
    const destinatariosGrupo: DestinatarioGrupo[] = [];

    // Crear destinatarios por persona
    mensajes.forEach(mensaje => {
      const numDestinatariosPersona = Math.floor(Math.random() * 5) + 1; // 1-5 personas

      for (let i = 0; i < numDestinatariosPersona; i++) {
        const randomPersona = personas[Math.floor(Math.random() * personas.length)];
        
        // Evitar duplicados
        if (!destinatariosPersona.some(dp => dp.mensaje?.id === mensaje.id && dp.persona?.id === randomPersona.id)) {
          const dp = new DestinatarioPersona();
          dp.mensaje = mensaje;
          dp.persona = randomPersona;
          destinatariosPersona.push(dp);
        }
      }

      // Crear destinatarios por grupo
      const numDestinatariosGrupo = Math.floor(Math.random() * 3); // 0-2 grupos

      for (let i = 0; i < numDestinatariosGrupo; i++) {
        const randomGrupo = grupos[Math.floor(Math.random() * grupos.length)];
        
        // Evitar duplicados
        if (!destinatariosGrupo.some(dg => dg.mensaje?.id === mensaje.id && dg.grupo?.id === randomGrupo.id)) {
          const dg = new DestinatarioGrupo();
          dg.mensaje = mensaje;
          dg.grupo = randomGrupo;
          destinatariosGrupo.push(dg);
        }
      }
    });

    await destinatarioPersonaRepository.save(destinatariosPersona);
    await destinatarioGrupoRepository.save(destinatariosGrupo);

    this.logger.log(`✓ Se crearon ${destinatariosPersona.length} destinatarios por persona`);
    this.logger.log(`✓ Se crearon ${destinatariosGrupo.length} destinatarios por grupo`);
  }
}
