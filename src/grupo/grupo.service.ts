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

@Injectable()
export class GrupoService {
  constructor(
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,

    @InjectRepository(GrupoPersona)
    private readonly grupoPersonaRepository: Repository<GrupoPersona>,

    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,

    private readonly notificacionService: NotificacionService, // Inyectamos el servicio de notificaciones
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

    return {
      success: true,
      message: '¡Grupo creado y miembros añadidos!',
      data: grupoGuardado
    };
  }

  /**
   * Obtiene todos los grupos donde participa una persona (como admin o miembro)
   */
  async findByPersona(personaId: string) {
    const membresias = await this.grupoPersonaRepository.find({
      where: { persona: { id: String(personaId) } },
      relations: ['grupo'],
    });

    // Filtramos para devolver solo los objetos Grupo
    return membresias.map(m => m.grupo);
  }
}