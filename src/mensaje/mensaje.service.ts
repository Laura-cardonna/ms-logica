import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';
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

  // ==========================================
  // ✨ NUEVO: Guardar mensaje privado (Chat 1 a 1)
  // ==========================================
  async enviarMensajePrivado(emisorId: string, receptorId: string, contenido: string, ubicacion?: any) {
    // 🚨 Validación estricta de 500 caracteres
    if (contenido && contenido.length > 500) {
      throw new BadRequestException('El mensaje excede el límite permitido de 500 caracteres.');
    }

    const nuevoMensaje = this.mensajeRepository.create({
      contenido,
      emisor: { id: emisorId } as Persona, 
      receptor: { id: receptorId } as Persona,
      // ✅ CORRECCIÓN FINAL: Cambiamos null por undefined para que TypeScript esté feliz
      ubicacion: ubicacion ? JSON.stringify(ubicacion) : undefined, 
      fechaEnvio: new Date()
    });

    return await this.mensajeRepository.save(nuevoMensaje);
  }

  // ==========================================
  // ✨ NUEVO: Obtener historial directo (Bandeja 1 a 1)
  // ==========================================
  async obtenerHistorialPrivado(emisorId: string, receptorId: string) {
    return await this.mensajeRepository.find({
      where: [
        // ✅ CORRECCIÓN 3: Buscamos usando el objeto receptor, no la propiedad plana
        { emisor: { id: emisorId }, receptor: { id: receptorId } },
        { emisor: { id: receptorId }, receptor: { id: emisorId } },
      ],
      relations: ['emisor', 'receptor'], // Traemos los datos para mostrar los nombres en el frontend
      order: { fechaEnvio: 'ASC' }
    });
  }

  // 👇 MÉTODO ORIGINAL: Marcar mensaje como leído 👇
  async marcarComoLeido(mensajeId: number) {
    const mensaje = await this.mensajeRepository.findOne({ where: { id: mensajeId } });
    if (mensaje) {
      mensaje.leidoAt = new Date();
      return await this.mensajeRepository.save(mensaje);
    }
    throw new Error('Mensaje no encontrado');
  }

  // 👇 MÉTODO ORIGINAL ACTUALIZADO: Enviar mensaje a un grupo 👇
  async enviarMensajeAGrupo(emisorId: string, grupoId: number, contenido: string) {
    // 🚨 Validación estricta de 500 caracteres (agregada aquí también)
    if (contenido && contenido.length > 500) {
      throw new BadRequestException('El mensaje excede los 500 caracteres permitidos.');
    }

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

  // 👇 MÉTODO ORIGINAL INTACTO: Obtener historial del chat de un grupo 👇
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
      leidoAt: rel.mensaje?.leidoAt,
      emisorNombre: rel.mensaje?.emisor?.nombre,
      emisorId: rel.mensaje?.emisor?.id,
    }));

    // 3. Aplicar filtro inteligente de historial basado en el rol de la membresía
    if (membresia && personaId) {
      
      // 🏳️ ESTADO: ABANDONADO ACTUALMENTE
      if (membresia.rol === 'abandonado') {
        console.log(`\n--- 🔍 DIAGNÓSTICO EN CONSOLA ---`);
        console.log(`[Paso 1] Usuario ${personaId} está como ABANDONADO en Grupo: ${grupoId}`);

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
            
            // FILTRO ESTRICTO EN MILISEGUNDOS
            return fechaMsg <= fechaSalida || fechaMsg >= fechaUnionActual;
          });
        }
      }
    }

    return todosLosMensajes;
  }
}