import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Grupo } from './entities/grupo.entity';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { NotificacionService } from 'src/notificacion/notificacion.service'; // IMPORTANTE: Agregar este import
import { CreateGrupoDto } from './dto/create-grupo.dto';
import * as fs from 'fs';
import * as path from 'path';
import { GrupoMembresiaLog } from './entities/grupo-membresia-log.entity';
import { MensajeGateway } from 'src/mensaje/mensaje.gateway';

@Injectable()
export class GrupoService {
  constructor(
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,

    @InjectRepository(GrupoPersona)
    private readonly grupoPersonaRepository: Repository<GrupoPersona>,

    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,

    @InjectRepository(GrupoMembresiaLog)
    private readonly logRepository: Repository<GrupoMembresiaLog>,

    private readonly notificacionService: NotificacionService, // Inyectamos el servicio de notificaciones

    private readonly mensajeGateway: MensajeGateway,

  ) {}

  async create(createGrupoDto: CreateGrupoDto) {
    const { creadorId, miembrosIds, base64Imagen, ...datosGrupo } = createGrupoDto;

    // 1. Validaciones iniciales
    if (!creadorId) throw new BadRequestException('El ID del creador es obligatorio');
    if (!miembrosIds || miembrosIds.length < 2) {
      throw new BadRequestException('Se requieren al menos 2 miembros adicionales aparte del creador');
    }

    // 2. Verificar que el creador existe
    const creador = await this.personaRepository.findOne({
      where: { id: String(creadorId) }
    });
    if (!creador) throw new BadRequestException('El creador no existe en el sistema');

    // 3. Verificar que los invitados existan
    const invitados = await this.personaRepository.findBy({
      id: In(miembrosIds),
    });

    if (invitados.length !== miembrosIds.length) {
      throw new BadRequestException('Algunos de los miembros invitados no existen');
    }

    // 4. Crear instancia del grupo
    const nuevoGrupo = this.grupoRepository.create(datosGrupo);

    // 5. 📁 Lógica de procesamiento de imagen (Subida física)
    if (base64Imagen) {
      const carpetaDestino = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      const nombreArchivo = `grupo_${Date.now()}.jpg`;
      const rutaCompleta = path.join(carpetaDestino, nombreArchivo);

      try {
        const limpiarBase64 = base64Imagen.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(rutaCompleta, limpiarBase64, { encoding: 'base64' });

        // Guardamos el nombre del archivo en el campo imagenUrl
        nuevoGrupo.imagenUrl = nombreArchivo;
      } catch (error) {
        console.error('Error al guardar icono de grupo:', error);
        throw new BadRequestException('Fallo al procesar la imagen del grupo.');
      }
    }

    // 6. Guardar el grupo en la BD
    const grupoGuardado = await this.grupoRepository.save(nuevoGrupo);

    // 7. Crear las relaciones en GrupoPersona
    const membresias: GrupoPersona[] = [];

    // Creador como administrador
    membresias.push(this.grupoPersonaRepository.create({
      grupo: grupoGuardado,
      persona: creador,
      rol: 'administrador'
    }));

    // Invitados como miembros
    invitados.forEach(personaInvita => {
      membresias.push(this.grupoPersonaRepository.create({
        grupo: grupoGuardado,
        persona: personaInvita,
        rol: 'miembro'
      }));
    });

    await this.grupoPersonaRepository.save(membresias);

    // 8. 🔔 NOTIFICACIONES: Avisar a cada invitado que fue añadido
    try {
      const promesasNotificaciones = invitados.map(invitado =>
        this.notificacionService.crearNotificacion(
          invitado,
          'Nueva Comunidad',
          `Has sido añadido al grupo "${grupoGuardado.nombre}" por ${creador.nombre}.`
        )
      );
      // Las disparamos todas en paralelo
      await Promise.all(promesasNotificaciones);
    } catch (error) {
      // Logeamos el error pero no bloqueamos la creación del grupo si fallan las notis
      console.error('Error al generar notificaciones de grupo:', error);
    }

    // 🚨 NUEVO: Guardar logs de los miembros añadidos por el creador
    try {
      const logs = invitados.map(invitado => 
        this.logRepository.create({
          grupo: grupoGuardado,
          usuarioAfectado: invitado,
          usuarioAccion: creador,
          accion: 'AÑADIR'
        })
      );
      await this.logRepository.save(logs);
    } catch (logError) {
      console.error('Error al guardar logs de creación de grupo:', logError);
    }

    return {
      success: true,
      message: '¡Grupo creado y miembros añadidos!',
      data: grupoGuardado
    };
  }


/**
   * Obtiene todos los grupos donde participa una persona con el conteo de miembros
   */
/**

/**
   * Obtiene todos los grupos donde participa una persona con el conteo de miembros y fecha de unión
   */
async findByPersona(personaId: string) {
    const membresias = await this.grupoPersonaRepository.find({
      where: { persona: { id: String(personaId) } },
      relations: ['grupo'],
    });

    const gruposIds = membresias
      .map(m => m.grupo?.id)
      .filter((id): id is number => id !== undefined);

    if (gruposIds.length === 0) return [];

    const grupos = await this.grupoRepository.createQueryBuilder('grupo')
      .loadRelationCountAndMap('grupo.cantidadMiembros', 'grupo.miembros')
      .where('grupo.id IN (:...ids)', { ids: gruposIds })
      .getMany();

    // Inyectamos la fechaUnion real y el rol de la tabla intermedia
    return grupos.map(grupo => {
      const membresia = membresias.find(m => m.grupo?.id === grupo.id);
      return {
        ...grupo,
        fechaUnion: membresia ? membresia.fechaUnion : null,
        rol: membresia ? membresia.rol : 'miembro' // 👈 Garantiza traer 'abandonado', 'bloqueado', 'miembro' o 'administrador'
      };
    });
  }

 /**
   * Obtiene grupos públicos en los que el usuario NO participa todavía
   */
async findPublicosDisponibles(personaId: string) {
    // Buscamos solo membresías donde el usuario es miembro activo, admin o bloqueado
    const misMembresiasActivas = await this.grupoPersonaRepository.find({
      where: [
        { persona: { id: personaId }, rol: 'miembro' },
        { persona: { id: personaId }, rol: 'administrador' },
        { persona: { id: personaId }, rol: 'bloqueado' }
      ],
      relations: ['grupo'],
    });

    const misGruposIds = misMembresiasActivas
      .map(m => m.grupo?.id)
      .filter((id): id is number => id !== undefined);

    // Seleccionamos el grupo y contamos sus relaciones en grupo_persona
    const query = this.grupoRepository.createQueryBuilder('grupo')
      .loadRelationCountAndMap('grupo.cantidadMiembros', 'grupo.miembros')
      .where('grupo.esPublico = :esPublico', { esPublico: true });

    if (misGruposIds.length > 0) {
      query.andWhere('grupo.id NOT IN (:...ids)', { ids: misGruposIds });
    }

    return await query.getMany();
  }

  /**
   * Permite que una persona se una a un grupo público
   */
async unirseAGrupo(grupoId: number, personaId: string) {
    // 1. Verificar si el grupo existe
    const grupo = await this.grupoRepository.findOne({ where: { id: grupoId } });
    if (!grupo) throw new BadRequestException('El grupo no existe');
    if (!grupo.esPublico) throw new BadRequestException('Este grupo es privado');

    // 2. Verificar si la persona existe
    const persona = await this.personaRepository.findOne({ where: { id: personaId } });
    if (!persona) throw new BadRequestException('La persona no existe');

    // 3. Verificar si ya es miembro, está bloqueado o había abandonado antes
    const existente = await this.grupoPersonaRepository.findOne({
      where: { grupo: { id: grupoId }, persona: { id: personaId } }
    });

    if (existente) {
      if (existente.rol === 'bloqueado') throw new BadRequestException('Estás bloqueado y no puedes unirte a este grupo');
      
      // 🚀 SI HABÍA ABANDONADO: Lo reactivamos cambiando su rol a miembro y actualizando la fecha de unión
      if (existente.rol === 'abandonado') {
        existente.rol = 'miembro';
        existente.fechaUnion = new Date(); // Reinicia la fecha para controlar el flujo de visualización
        await this.grupoPersonaRepository.save(existente);

        // Guardar log de re-unión en la bitácora
        try {
          const nuevoLog = this.logRepository.create({
            grupo: grupo,
            usuarioAfectado: persona,
            usuarioAccion: undefined,
            accion: 'UNIRSE'
          });
          await this.logRepository.save(nuevoLog);
        } catch (logError) {
          console.error('Error al guardar log de re-unirse a grupo:', logError);
        }

        return { success: true, message: 'Te has unido al grupo con éxito' };
      }

      throw new BadRequestException('Ya eres miembro activo de este grupo');
    }

    // 4. Crear la membresía por primera vez si no existía registro previo
    const nuevaMembresia = this.grupoPersonaRepository.create({
      grupo: grupo,
      persona: persona,
      rol: 'miembro'
    });

    await this.grupoPersonaRepository.save(nuevaMembresia);

    // 5. Notificar bienvenida
    await this.notificacionService.crearNotificacion(
      persona,
      '¡Bienvenido!',
      `Ahora eres miembro de la comunidad "${grupo.nombre}".`
    );

    // Guardar log de auto-unión
    try {
      const nuevoLog = this.logRepository.create({
        grupo: grupo,
        usuarioAfectado: persona,
        usuarioAccion: undefined,
        accion: 'UNIRSE'
      });
      await this.logRepository.save(nuevoLog);
    } catch (logError) {
      console.error('Error al guardar log de unirse a grupo:', logError);
    }

    return { success: true, message: 'Te has unido al grupo con éxito' };
  }

  // --------------------------------------------------------
  // NUEVAS FUNCIONES PARA ADMINISTRACIÓN DE GRUPOS (HU-010)
  // --------------------------------------------------------

  /**
   * Helper: Verifica si el usuario que ejecuta la acción es administrador del grupo
   */
  private async verificarAdmin(grupoId: number, adminId: string) {
    const adminEnGrupo = await this.grupoPersonaRepository.findOne({
      where: { grupo: { id: grupoId }, persona: { id: String(adminId) } }
    });
    
    if (!adminEnGrupo || adminEnGrupo.rol !== 'administrador') {
      throw new BadRequestException('No tienes permisos de administrador para realizar esta acción');
    }
    return adminEnGrupo;
  }

/**
   * Obtiene la lista de miembros de un grupo (con búsqueda opcional) - Incluye Bloqueados para control de Admin
   */
  async obtenerMiembros(grupoId: number, search?: string) {
  const query = this.grupoPersonaRepository.createQueryBuilder('gp')
    .leftJoinAndSelect('gp.persona', 'persona')
    .where('gp.grupo_id = :grupoId', { grupoId })
    .andWhere('gp.rol != :rolAbandonado', { rolAbandonado: 'abandonado' }); // ✨ SOLUCIÓN: Excluir a los que abandonaron

  if (search) {
    query.andWhere('LOWER(persona.nombre) LIKE LOWER(:search)', { search: `%${search}%` });
  }

  query.orderBy('gp.fechaUnion', 'DESC');
  return await query.getMany();
}

/**
   * Promueve un miembro a administrador
   */
  async promoverAdmin(grupoId: number, personaId: string, adminEjecutorId: string) {
    await this.verificarAdmin(grupoId, adminEjecutorId);
    
    const membresia = await this.grupoPersonaRepository.findOne({
      where: { grupo: { id: grupoId }, persona: { id: String(personaId) } },
      relations: ['persona', 'grupo']
    });

    if (!membresia) throw new BadRequestException('El usuario no es miembro de este grupo');
    if (membresia.rol === 'administrador') throw new BadRequestException('El usuario ya es administrador');
    
    // Verificaciones para que TypeScript sepa que existen
    if (!membresia.persona || !membresia.grupo) {
      throw new BadRequestException('Datos inconsistentes en la membresía');
    }
    
    membresia.rol = 'administrador';
    await this.grupoPersonaRepository.save(membresia);

    // TODO: Inyectar LogRepository para guardar la acción aquí
    
    await this.notificacionService.crearNotificacion(
      membresia.persona, // Ya validamos que existe, TS no se queja
      'Ascenso en Comunidad',
      `Has sido promovido a administrador en el grupo "${membresia.grupo.nombre}".` 
    );

    // 🚨 NUEVO: Guardar log de ascenso
    try {
      const nuevoLog = this.logRepository.create({
        grupo: membresia.grupo,
        usuarioAfectado: membresia.persona,
        usuarioAccion: { id: adminEjecutorId } as Persona,
        accion: 'PROMOVER'
      });
      await this.logRepository.save(nuevoLog);
    } catch (logError) {
      console.error('Error al guardar log de promover admin:', logError);
    }

    return { success: true, message: 'Usuario promovido a administrador exitosamente' };
  }

  /**
   * Remueve a un miembro del grupo
   */
  /**
   * Remueve a un miembro del grupo (Expulsión por Admin)
   */
  async removerMiembro(grupoId: number, personaId: string, adminEjecutorId: string) {
    await this.verificarAdmin(grupoId, adminEjecutorId);

    const membresia = await this.grupoPersonaRepository.findOne({
      where: { grupo: { id: grupoId }, persona: { id: String(personaId) } },
      relations: ['persona', 'grupo']
    });

    if (!membresia) throw new BadRequestException('El usuario no pertenece al grupo');
    if (membresia.rol === 'administrador') throw new BadRequestException('No puedes remover a otro administrador directamente');

    const persona = membresia.persona;
    const grupo = membresia.grupo;

    if (!persona || !grupo) {
       throw new BadRequestException('Datos inconsistentes en la membresía');
    }

    try {
      const nuevoLog = this.logRepository.create({
        grupo: grupo,
        usuarioAfectado: persona,
        usuarioAccion: { id: adminEjecutorId } as Persona,
        accion: 'REMOVER'
      });
      await this.logRepository.save(nuevoLog);
    } catch (logError) {
      console.error('Error al guardar log de remover miembro:', logError);
    }

    // 1. Cambiamos el rol a 'abandonado' para guardar el historial sin borrar la fila
    membresia.rol = 'abandonado'; 
    await this.grupoPersonaRepository.save(membresia);

    // 2. ⚡ EMISIÓN WEBSOCKET MODIFICADA:
    // Cambiamos 'usuario_expulsado' por 'usuario_abandono' para que tu Front lo detecte en tiempo real
    try {
      if (this.mensajeGateway && this.mensajeGateway.server) {
        this.mensajeGateway.server.to(`grupo_${grupoId}`).emit('usuario_abandono', {
          grupoId: grupoId,
          personaId: personaId
        });
      }
    } catch (error) {
      console.error('Error al emitir expulsión por WS', error);
    }

    await this.notificacionService.crearNotificacion(
      persona,
      'Removido del Grupo',
      `Has sido removido del grupo "${grupo.nombre}". Ya no recibirás sus mensajes.`
    );

    return { success: true, message: 'Usuario removido del grupo' };
  }
/**
   * Obtiene la bitácora de cambios de membresía de un grupo específico
   */
  async obtenerLogsMembresia(grupoId: number) {
    return await this.logRepository.find({
      where: { grupo: { id: grupoId } },
      relations: ['usuarioAfectado', 'usuarioAccion'],
      order: { fecha: 'DESC' }, // Trae primero los más recientes
    });
  }

/**
   * Permite a un usuario abandonar voluntariamente un grupo manteniendo su historial
   */
  async abandonarGrupo(grupoId: number, personaId: string) {
    // 1. Buscar la membresía activa del usuario
    const membresia = await this.grupoPersonaRepository.findOne({
      where: { grupo: { id: grupoId }, persona: { id: String(personaId) } },
      relations: ['persona', 'grupo']
    });

    if (!membresia || membresia.rol === 'abandonado') {
      throw new BadRequestException('No perteneces a este grupo o ya lo has abandonado');
    }
    if (membresia.rol === 'bloqueado') throw new BadRequestException('No puedes realizar esta acción');

    const persona = membresia.persona;
    const grupo = membresia.grupo;

    if (!persona || !grupo) {
       throw new BadRequestException('Datos inconsistentes en la membresía');
    }

    // 2. Registrar el Log de Auditoría
    try {
      const nuevoLog = this.logRepository.create({
        grupo: grupo,
        usuarioAfectado: persona,
        usuarioAccion: persona, // Se afectó a sí mismo voluntariamente
        accion: 'REMOVER' // Usamos REMOVER para mantener la coherencia de tu bitácora
      });
      await this.logRepository.save(nuevoLog);
    } catch (logError) {
      console.error('Error al guardar log de abandono voluntario:', logError);
    }

    // 3. 🚀 MODIFICACIÓN CLAVE: Cambiar el rol a 'abandonado' en lugar de usar .remove()
    membresia.rol = 'abandonado';
    await this.grupoPersonaRepository.save(membresia);

    // 4. Notificar a los administradores del grupo (Persistente + ⚡ TIEMPO REAL)
    try {
      const administradores = await this.grupoPersonaRepository.find({
        where: { grupo: { id: grupoId }, rol: 'administrador' },
        relations: ['persona']
      });

      // Enviamos la notificación normal a la base de datos
      const promesasNotis = administradores.map(admin => {
        if (admin.persona) {
          return this.notificacionService.crearNotificacion(
            admin.persona,
            'Salida de Miembro',
            `${persona.nombre} ha abandonado voluntariamente el grupo "${grupo.nombre}".`
          );
        }
        return Promise.resolve();
      });
      await Promise.all(promesasNotis);

      // ⚡ TIEMPO REAL: Emitir evento por WebSockets a través del Gateway
      // Usamos el canal de la sala del grupo para que todos los administradores conectados lo sepan al instante
      if (this.mensajeGateway && this.mensajeGateway.server) {
        this.mensajeGateway.server.to(`grupo_${grupoId}`).emit('usuario_abandono', {
          grupoId: grupoId,
          personaId: personaId,
          nombrePersona: persona.nombre,
          mensaje: `${persona.nombre} ha abandonado la comunidad.`
        });
      }
    } catch (notifError) {
      console.error('Error al notificar en tiempo real a los admins del abandono:', notifError);
    }

    return { success: true, message: 'Has abandonado el grupo exitosamente' };
  }

}