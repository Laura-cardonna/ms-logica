import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import {GrupoPersona} from 'src/grupo_persona/entities/grupo_persona.entity'; // <-- Importamos la entidad para el repositorio
import { GrupoMembresiaLog } from 'src/grupo/entities/grupo-membresia-log.entity';
@Injectable()
export class MensajeService {
  constructor(
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,

    @InjectRepository(DestinatarioGrupo)
    private readonly destGrupoRepository: Repository<DestinatarioGrupo>,

    @InjectRepository(GrupoPersona)
    private readonly grupoPersonaRepository: Repository<GrupoPersona>,
  
    @InjectRepository(GrupoMembresiaLog)
    private readonly logRepository: Repository<GrupoMembresiaLog>,
  ) { }

  // Enviar mensaje a un grupo
  async enviarMensajeAGrupo(emisorId: string, grupoId: number, contenido: string) {
    // 1. Creamos el mensaje base
    const nuevoMensaje = this.mensajeRepository.create({
      contenido,
      emisor: { id: emisorId } as Persona,
    });

    const mensajeGuardado = await this.mensajeRepository.save(nuevoMensaje);

    // 2. Creamos la relación con el grupo
    const destinatario = this.destGrupoRepository.create({
      mensaje: mensajeGuardado,
      grupo: { id: grupoId } as Grupo,
    });

    await this.destGrupoRepository.save(destinatario);

    return { ...mensajeGuardado, grupoId };
  }

// Obtener historial del chat de un grupo validando bloqueos, abandonos y reingresos
  async obtenerMensajesPorGrupo(grupoId: number, personaId?: string) {
    let membresia: GrupoPersona | null = null;

    console.log(`\n============== DETECTANDO RECARGA ==============`);
    console.log(`-> GRUPO ID RECIBIDO:`, grupoId);
    console.log(`-> PERSONA ID RECIBIDO DESDE FRONTEND:`, personaId);
    // 1. Validar el rol del usuario si viene su ID
    if (personaId) {
      membresia = await this.grupoPersonaRepository.findOne({
        where: { grupo: { id: Number(grupoId) }, persona: { id: String(personaId) } }
      });

      // Si está bloqueado, historial vacío por seguridad inmediata
      if (membresia && membresia.rol === 'bloqueado') {
        return [];
      }
    }

    // 2. Ejecutar la consulta base de relaciones de mensajes del grupo
    const relaciones = await this.destGrupoRepository.find({
      where: { grupo: { id: grupoId } },
      relations: ['mensaje', 'mensaje.emisor'],
      order: { mensaje: { fechaEnvio: 'ASC' } }, 
    });

    // Mapeamos los mensajes iniciales
    const todosLosMensajes = relaciones.map(rel => ({
      id: rel.mensaje?.id,
      contenido: rel.mensaje?.contenido,
      fechaEnvio: rel.mensaje?.fechaEnvio,
      emisorNombre: rel.mensaje?.emisor?.nombre,
      emisorId: rel.mensaje?.emisor?.id,
    }));

    // 3. Aplicar filtro inteligente de historial basado en el rol de la membresía
    if (membresia && personaId) {
      
      // 🏳️ ESTADO: ABANDONADO ACTUALMENTE
// 🏳️ ESTADO: ABANDONADO ACTUALMENTE
      if (membresia.rol === 'abandonado') {
        console.log(`\n--- 🔍 DIAGNÓSTICO EN CONSOLA ---`);
        console.log(`[Paso 1] Usuario ${personaId} está como ABANDONADO en Grupo: ${grupoId}`);

        // Buscamos forzando los tipos numéricos y de string limpios para TypeORM
        const ultimoLogSalida = await this.logRepository.findOne({
          where: {
            grupo: { id: Number(grupoId) },
            usuarioAfectado: { id: String(personaId) },
            accion: 'REMOVER'
          },
          order: { fecha: 'DESC' }
        });

        if (!ultimoLogSalida) {
          console.log(`[Paso 2] ❌ ERROR: No se encontró el log 'REMOVER' en la base de datos.`);
          return todosLosMensajes;
        }

        console.log(`[Paso 2] ✅ Log encontrado. Fecha de salida: ${ultimoLogSalida.fecha}`);
        const fechaSalida = ultimoLogSalida.fecha ? new Date(ultimoLogSalida.fecha).getTime() : 0;        

        const mensajesFiltrados = todosLosMensajes.filter(msg => {
          if (!msg.fechaEnvio) return false;
          const fechaMsg = new Date(msg.fechaEnvio).getTime();
          
          const esValido = fechaMsg <= fechaSalida;
          console.log(`   👉 MSG [${msg.id}]: "${msg.contenido}" | ¿Se muestra?: ${esValido}`);
          return esValido;
        });

        console.log(`[Paso 3] Devolviendo ${mensajesFiltrados.length} mensajes de ${todosLosMensajes.length} totales.`);
        return mensajesFiltrados;
      }
      
// 🟢 ESTADO: MIEMBRO ACTIVO / REINGRESADO
      if (membresia.rol === 'miembro' || membresia.rol === 'administrador') {
        const fechaUnionActual = membresia.fechaUnion ? new Date(membresia.fechaUnion).getTime() : null;
        
        // Buscamos forzando los tipos limpios para TypeORM igual que en el bloque de abandonado
        const ultimoLogSalida = await this.logRepository.findOne({
          where: {
            grupo: { id: Number(grupoId) },
            usuarioAfectado: { id: String(personaId) },
            accion: 'REMOVER'
          },
          order: { fecha: 'DESC' }
        });

        if (ultimoLogSalida && ultimoLogSalida.fecha && fechaUnionActual) {
          const fechaSalida = new Date(ultimoLogSalida.fecha).getTime();
          
          return todosLosMensajes.filter(msg => {
            if (!msg.fechaEnvio) return false;
            const fechaMsg = new Date(msg.fechaEnvio).getTime();
            
            // FILTRO ESTRICTO EN MILISEGUNDOS:
            // Pasa si el mensaje es de antes de salirse O de después de volver a entrar.
            // Los del intermedio quedan completamente eliminados.
            return fechaMsg <= fechaSalida || fechaMsg >= fechaUnionActual;
          });
        }
      }
    }

    return todosLosMensajes;
  }
}