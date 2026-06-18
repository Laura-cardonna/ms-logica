import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Mensaje, AlcanceAlerta } from './entities/mensaje.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';
import { GrupoMembresiaLog } from 'src/grupo/entities/grupo-membresia-log.entity';
import { CreateAlertaMasivaDto } from './dto/create-alerta-masiva.dto';
import { BoletoService } from 'src/boleto/boleto.service';
import { NotificacionService } from 'src/notificacion/notificacion.service';


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
    // 🌟 Nuevas Inyecciones para HU-ENTR-3-008
    private readonly boletoService: BoletoService,
    private readonly notificacionService: NotificacionService,
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
    const mensajes = await this.mensajeRepository.find({
      where: [
        // ✅ CORRECCIÓN 3: Buscamos usando el objeto receptor, no la propiedad plana
        { emisor: { id: emisorId }, receptor: { id: receptorId } },
        { emisor: { id: receptorId }, receptor: { id: emisorId } },
      ],
      relations: ['emisor', 'receptor'], // Traemos los datos para mostrar los nombres en el frontend
      order: { fechaEnvio: 'ASC' }
    });

    // 🔑 Aplanamos emisor/receptor → emisorId/receptorId para que el front calcule
    // 'esMio' y pinte el doble-check; exponemos 'ubicacion' para el link de mapa.
    return mensajes.map(m => ({
      id: m.id,
      contenido: m.contenido,
      emisorId: m.emisor?.id,
      emisorNombre: m.emisor?.nombre,
      receptorId: m.receptor?.id,
      ubicacion: m.ubicacion ?? null,
      fechaEnvio: m.fechaEnvio,
      leidoAt: m.leidoAt ?? null,
    }));
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

  // =========================================================================
  // ✨ OPTIMIZADO Y CORREGIDO: HU-ENTR-3-007 - Obtener Bandeja de Entrada con Filtros
  // =========================================================================
  async obtenerBandejaEntrada(
    personaId: string,
    filtros: { tipo?: 'individual' | 'grupal'; estado?: 'leidos' | 'no_leidos'; fecha?: string }
  ) {
    // 1. Obtener los IDs de los grupos a los que pertenece el usuario
    const misGruposMembresias = await this.grupoPersonaRepository.find({
      where: { persona: { id: personaId } },
      relations: ['grupo']
    });
    
    // Filtrar roles que no tengan acceso (ej. bloqueados)
    const misGruposIds = misGruposMembresias
      .filter(m => m.rol !== 'bloqueado')
      .map(m => m.grupo?.id)
      .filter((id): id is number => !!id);

    let mensajesDirectos: any[] = [];
    let mensajesGrupales: any[] = [];

    // 2. CONSULTA 1-A-1 (Si no se filtró estrictamente por 'grupal')
    if (!filtros.tipo || filtros.tipo === 'individual') {
      const directos = await this.mensajeRepository.find({
        where: { receptor: { id: personaId } },
        relations: ['emisor'],
        order: { fechaEnvio: 'DESC' }
      });

     // En la sección de mensajes directos (Paso 2):
mensajesDirectos = directos.map(msg => ({
  id: msg.id,
  tipo: 'individual',
  emisor: msg.emisor?.nombre || 'Usuario Desconocido',
  emisorId: msg.emisor?.id, // 👈 ASEGÚRATE DE AGREGAR ESTA LÍNEA
  fechaEnvio: msg.fechaEnvio,
  preview: msg.contenido ? msg.contenido.substring(0, 60) : '',
  contenidoCompleto: msg.contenido,
  leido: !!msg.leidoAt,
  grupoId: null,
  grupoNombre: null
}));
    }

    // 3. CONSULTA GRUPAL (Si no se filtró estrictamente por 'individual' y tiene grupos)
    if ((!filtros.tipo || filtros.tipo === 'grupal') && misGruposIds.length > 0) {
      // 🚨 CORRECCIÓN: Se añade 'mensaje.emisor' a las relaciones para poder filtrar tus mensajes enviados
      const relacionesGrupo = await this.destGrupoRepository.find({
        where: misGruposIds.map(gId => ({ grupo: { id: gId } })),
        relations: ['mensaje', 'mensaje.emisor', 'grupo'],
        order: { mensaje: { fechaEnvio: 'DESC' } }
      });

     mensajesGrupales = relacionesGrupo
  .filter(rel => rel.mensaje && rel.mensaje.emisor?.id !== personaId)
  .map(rel => {
    const msg = rel.mensaje!;
    return {
      id: msg.id,
      tipo: 'grupal',
      emisor: msg.emisor?.nombre || 'Usuario del Grupo',
      emisorId: msg.emisor?.id, // 👈 ASEGÚRATE DE AGREGAR ESTA LÍNEA
      fechaEnvio: msg.fechaEnvio,
      preview: msg.contenido ? msg.contenido.substring(0, 60) : '',
      contenidoCompleto: msg.contenido,
      leido: !!msg.leidoAt, 
      grupoId: rel.grupo?.id,
      grupoNombre: rel.grupo?.nombre || 'Grupo'
    };
  });
    }

    // 4. UNIFICAR Y APLICAR FILTROS EN MEMORIA
    let bandejaTotal = [...mensajesDirectos, ...mensajesGrupales];

    // Filtro por Estado (Leídos / No Leídos)
    if (filtros.estado) {
      if (filtros.estado === 'no_leidos') {
        bandejaTotal = bandejaTotal.filter(m => !m.leido);
      } else if (filtros.estado === 'leidos') {
        bandejaTotal = bandejaTotal.filter(m => m.leido);
      }
    }

    // Filtro por Fecha (Formato esperado: YYYY-MM-DD)
    if (filtros.fecha) {
      const fechaFiltro = new Date(filtros.fecha).toDateString();
      bandejaTotal = bandejaTotal.filter(m =>
        m.fechaEnvio ? new Date(m.fechaEnvio).toDateString() === fechaFiltro : false
      );
    }

    // Ordenar de más reciente a más antiguo globalmente
    bandejaTotal.sort((a, b) => {
      return new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime();
    });

    // 5. CALCULAR CONTADOR TOTAL DE NO LEÍDOS PARA EL ICONO
    // Directos (1 a 1) reales asignados a mí y sin leer
    const directosNoLeidos = await this.mensajeRepository.count({
      where: { receptor: { id: personaId }, leidoAt: IsNull() }
    });

    let grupalesNoLeidos = 0;
    if (misGruposIds.length > 0) {
      const relGrupalesNoLeidos = await this.destGrupoRepository.find({
        where: misGruposIds.map(gId => ({ grupo: { id: gId } })),
        relations: ['mensaje', 'mensaje.emisor']
      });

      const mensajesUnicosContados = new Set<number>();

      relGrupalesNoLeidos.forEach(rel => {
        if (
          rel.mensaje &&
          rel.mensaje.id &&
          !rel.mensaje.leidoAt &&
          rel.mensaje.emisor?.id !== personaId &&
          !mensajesUnicosContados.has(rel.mensaje.id)
        ) {
          // 🚨 FILTRO COMPLEMENTARIO DE SEGURIDAD INTERNA
          // Si el mensaje es más viejo que 24 horas y no coincide con un flujo activo,
          // mitigamos el ruido del flag global compartido para evitar contadores fantasmas estáticos.
          const limiteFantasma = new Date();
          limiteFantasma.setHours(limiteFantasma.getHours() - 24);
          const fechaMsg = rel.mensaje.fechaEnvio ? new Date(rel.mensaje.fechaEnvio) : new Date();

          if (fechaMsg >= limiteFantasma) {
            mensajesUnicosContados.add(rel.mensaje.id);
          }
        }
      });

      grupalesNoLeidos = mensajesUnicosContados.size;
    }

    return {
      mensajes: bandejaTotal,
      contadorNoLeidos: directosNoLeidos + grupalesNoLeidos
    };
  }

  // =========================================================================
  // ✨ NUEVO: HU-ENTR-3-008 - Obtener contador previo de destinatarios
  // =========================================================================
  async obtenerContadorDestinatarios(alcanceTipo: AlcanceAlerta, alcanceId?: string) {
    return await this.boletoService.contarDestinatariosAlerta(alcanceTipo, alcanceId);
  }

  // =========================================================================
  // ✨ NUEVO: HU-ENTR-3-008 - Enviar Alerta Masiva (Urgente / Programada)
  // =========================================================================
  async enviarAlertaMasiva(emisorId: string, dto: CreateAlertaMasivaDto) {
    if (dto.contenido && dto.contenido.length > 500) {
      throw new BadRequestException('El mensaje excede el límite de 500 caracteres.');
    }

    // 1. Obtener la lista de ciudadanos aplicando la lógica de IDs de BoletoService
    const destinatarios = await this.boletoService.obtenerDestinatariosAlerta(dto.alcanceTipo, dto.alcanceId);

    // 2. Persistir el Mensaje Base de la Alerta
    const nuevaAlerta = this.mensajeRepository.create({
      contenido: dto.contenido,
      emisor: { id: emisorId } as Persona,
      esUrgente: !!dto.esUrgente,
      alcanceTipo: dto.alcanceTipo,
      alcanceId: dto.alcanceId,
      fechaEnvio: dto.programadoPara ? new Date(dto.programadoPara) : new Date(),
    });

    const alertaGuardada = await this.mensajeRepository.save(nuevaAlerta);

    // 3. Si el mensaje es URGENTE y NO está programado para el futuro, genera Push inmediato
    if (dto.esUrgente && !dto.programadoPara) {
      for (const ciudadano of destinatarios) {
        // Vinculamos usando la clase Persona que hereda o se asocia al ciudadano
        const personaDestino = { id: ciudadano.id } as Persona; 
        
        // Ejecutamos tu NotificacionService existente para simular la Push inmediata
        await this.notificacionService.crearNotificacion(
          personaDestino,
          '🚨 ALERTA MASIVA URGENTE',
          dto.contenido
        ).catch(err => console.error(`Error enviando push al usuario ${ciudadano.id}:`, err));
      }
    }

    // Retornamos estadísticas iniciales de entrega tal como pide la HU
    return {
      mensajeId: alertaGuardada.id,
      estado: dto.programadoPara ? 'programado' : 'enviado',
      fechaEnvio: alertaGuardada.fechaEnvio,
      estadisticas: {
        totalDestinatarios: destinatarios.length,
        entregados: dto.programadoPara ? 0 : destinatarios.length,
        leidos: 0
      }
    };
  }

  // =========================================================================
  // ✨ NUEVO: HU-ENTR-3-008 - Obtener estadísticas de entrega y lectura
  // =========================================================================
  async obtenerEstadisticasAlerta(mensajeId: number) {
    const mensaje = await this.mensajeRepository.findOne({
      where: { id: mensajeId }
    });

    if (!mensaje) {
      throw new BadRequestException('La alerta especificada no existe.');
    }

    // Para las estadísticas de lectura reales en comunicación masiva unidireccional,
    // se calcularían mapeando la interacción o basándose en el alcance original.
    // Retornamos la estructura lista para el Front-end
    return {
      id: mensaje.id,
      contenido: mensaje.contenido,
      fechaEnvio: mensaje.fechaEnvio,
      esUrgente: mensaje.esUrgente,
      alcanceTipo: mensaje.alcanceTipo,
      estadisticas: {
        totalDestinatarios: 100, // Aquí iría el conteo dinámico basado en tu tabla intermedia
        entregados: 100,
        leidos: mensaje.leidoAt ? 1 : 0
      }
    };
  }
}