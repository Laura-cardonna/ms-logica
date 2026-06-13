import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
      const carpetaDestino = path.join(__dirname, '..', '..', 'uploads');
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
        rol: membresia?.rol || 'miembro' // 👈 Fallback seguro si no encuentra el rol
      } as any; // 👈 El "as any" le quita lo estricto a TypeScript para este objeto custom
    });
  }

 /**
   * Obtiene grupos públicos en los que el usuario NO participa todavía
   */
async findPublicosDisponibles(personaId: string) {
  const misMembresias = await this.grupoPersonaRepository.find({
    where: { persona: { id: personaId } },
    relations: ['grupo'],
  });

  const misGruposIds = misMembresias
    .map(m => m.grupo?.id)
    .filter((id): id is number => id !== undefined);

  // Seleccionamos el grupo y contamos sus relaciones en grupo_persona
  const query = this.grupoRepository.createQueryBuilder('grupo')
    .loadRelationCountAndMap('grupo.cantidadMiembros', 'grupo.miembros') // <--- Esto añade el conteo
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

    // 2. Verificar si la persona existe (Soluciona error TS2345 y TS2769)
    const persona = await this.personaRepository.findOne({ where: { id: personaId } });
    if (!persona) throw new BadRequestException('La persona no existe');

// 3. Verificar si ya es miembro o está bloqueado
    const existente = await this.grupoPersonaRepository.findOne({
      where: { grupo: { id: grupoId }, persona: { id: personaId } }
    });
    if (existente) {
      if (existente.rol === 'bloqueado') throw new BadRequestException('Estás bloqueado y no puedes unirte a este grupo');
      throw new BadRequestException('Ya eres miembro de este grupo');
    }

    // 4. Crear la membresía con objetos validados
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

    // 🚨 NUEVO: Guardar log de auto-unión
    try {
      const nuevoLog = this.logRepository.create({
        grupo: grupo,
        usuarioAfectado: persona,
        usuarioAccion: undefined, // Queda NULL en BD porque se unió solo
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
      .where('gp.grupo_id = :grupoId', { grupoId }); // 🚨 CORREGIDO: Ya no excluimos a los 'bloqueado'

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

    // Verificaciones para que TypeScript no arroje error
    if (!persona || !grupo) {
       throw new BadRequestException('Datos inconsistentes en la membresía');
    }

    // 🚨 NUEVO: Guardar log de remover miembro (Debe ir ANTES del remove de la membresía)
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

    // Eliminamos el registro de la base de datos
    await this.grupoPersonaRepository.remove(membresia);

    await this.notificacionService.crearNotificacion(
      persona,
      'Removido del Grupo',
      `Has sido removido del grupo "${grupo.nombre}". Ya no recibirás sus mensajes.`
    );

    return { success: true, message: 'Usuario removido del grupo' };
  }

  /**
   * Bloquea a un miembro (no puede volver a unirse)
   */
async bloquearMiembro(grupoId: number, personaId: string, adminEjecutorId: string) {
  await this.verificarAdmin(grupoId, adminEjecutorId);

  const membresia = await this.grupoPersonaRepository.findOne({
    where: { grupo: { id: grupoId }, persona: { id: String(personaId) } },
    relations: ['persona', 'grupo']
  });

  if (!membresia) throw new BadRequestException('El usuario no pertenece al grupo');
  if (membresia.rol === 'administrador') throw new BadRequestException('No puedes bloquear a un administrador');

  // Cambiamos el rol a bloqueado
  membresia.rol = 'bloqueado';
  await this.grupoPersonaRepository.save(membresia);

  // ⚡ NUEVO: Despachamos la orden por WebSockets en tiempo real
  try {
    this.mensajeGateway.notificarBloqueo(grupoId, personaId);
  } catch (error) {
    console.error('No se pudo emitir el bloqueo por WebSocket, pero quedó guardado en BD:', error);
  }

  // ⚡ NUEVO: Despachamos la orden por WebSockets en tiempo real
  try {
    this.mensajeGateway.notificarBloqueo(grupoId, personaId);
  } catch (error) {
    console.error('No se pudo emitir el bloqueo por WebSocket, pero quedó guardado en BD:', error);
  }

  // 🚨 NUEVO: Guardar log de bloqueo
  try {
    const nuevoLog = this.logRepository.create({
      grupo: membresia.grupo,
      usuarioAfectado: membresia.persona,
      usuarioAccion: { id: adminEjecutorId } as Persona,
      accion: 'BLOQUEAR'
    });
    await this.logRepository.save(nuevoLog);
  } catch (logError) {
    console.error('Error al guardar log de bloquear miembro:', logError);
  }

  return { success: true, message: 'Usuario bloqueado. No podrá volver a unirse.' };
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

}