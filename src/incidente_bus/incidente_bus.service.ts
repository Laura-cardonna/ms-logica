import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidenteBus } from './entities/incidente_bus.entity';
import { CreateIncidenteBusDto } from './dto/create-incidente_bus.dto';
import { Turno } from 'src/turno/entities/turno.entity';
import { Foto } from 'src/foto/entities/foto.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class IncidenteBusService {
  constructor(
    @InjectRepository(IncidenteBus)
    private readonly incidenteBusRepository: Repository<IncidenteBus>,

    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,

    @InjectRepository(Foto)
    private readonly fotoRepository: Repository<Foto>,

    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}

  // 📁 Reemplaza ÚNICAMENTE este método dentro de tu src/incidente_bus/incidente_bus.service.ts

  async reportarIncidente(
    dto: CreateIncidenteBusDto,
    usuarioId: string,
  ): Promise<IncidenteBus> {
    // 1. Buscar turno 'en_curso' con el ID del conductor como string
    const turnoActivo = await this.turnoRepository.findOne({
      where: {
        conductor: { id: usuarioId },
        estado: 'en_curso',
      },
      relations: ['bus', 'conductor'],
    });

    if (!turnoActivo) {
      throw new NotFoundException(
        'No se encontró ningún turno activo "en_curso" para su usuario.',
      );
    }

    // 2. Mapeo e inserción de datos reales
    const nuevoIncidente = this.incidenteBusRepository.create({
      tipo: dto.tipo,
      gravedad: dto.gravedad,
      descripcion: dto.descripcion,
      latitud: dto.latitud,
      longitud: dto.longitud,
      bus: turnoActivo.bus,
      turno: turnoActivo,
    });

    // 3. Almacenamiento de evidencias fotográficas (Modificado para escribir el archivo físico)
    if (dto.base64Fotos && dto.base64Fotos.length > 0) {
      if (dto.base64Fotos.length > 5) {
        throw new BadRequestException(
          'El límite estricto es de 5 fotografías.',
        );
      }

      // 🛡️ Determinamos la ruta de la carpeta 'uploads' en la raíz del proyecto
      const carpetaDestino = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      nuevoIncidente.fotos = dto.base64Fotos.map((base64Text, index) => {
        const nombreArchivo = `evidencia_${Date.now()}_${index}.jpg`;
        const rutaCompleta = path.join(carpetaDestino, nombreArchivo);

        try {
          // Limpiamos el prefijo del base64 si el cliente lo envía (ej: data:image/jpeg;base64,)
          const limpiarBase64 = base64Text.replace(
            /^data:image\/\w+;base64,/,
            '',
          );

          // 💾 Guardamos el archivo binario real en la carpeta uploads
          fs.writeFileSync(rutaCompleta, limpiarBase64, { encoding: 'base64' });

          const fotoEntidad = new Foto();
          fotoEntidad.url = nombreArchivo;
          return fotoEntidad;
        } catch (error) {
          console.error(
            'Error al escribir el archivo de imagen en disco:',
            error,
          );
          throw new BadRequestException(
            'Ocurrió un fallo guardando las imágenes adjuntas.',
          );
        }
      });
    }

    return await this.incidenteBusRepository.save(nuevoIncidente);
  }

  /**
   * 🚨 Obtiene las alertas de incidentes graves (alto o crítico) de una empresa
   * Retorna: fecha_creacion, placa del bus, tipo de incidente y gravedad
   * Ordenados del más reciente al más antiguo
   */
  async obtenerAlertasGerente(empresaId: number): Promise<any[]> {
    try {
      // Enfoque alternativo: traer todos los incidentes con relaciones y filtrar en memoria
      const incidentes = await this.incidenteBusRepository.find({
        relations: ['bus', 'bus.empresa'],
        order: { timestamp: 'DESC' },
      });

      // Filtrar por empresa y gravedad en memoria
      const alertas = incidentes
        .filter((inc) => {
          const empresaDelBus = inc.bus?.empresa?.id;
          const gravedad = inc.gravedad;
          console.log(
            `🔍 Incidente ${inc.id}: empresa=${empresaDelBus}, gravedad=${gravedad}`,
          );
          return (
            empresaDelBus === empresaId &&
            (gravedad === 'alto' || gravedad === 'critico')
          );
        })
        .map((inc) => ({
          id: inc.id,
          fechaCreacion: inc.timestamp,
          placaBus: inc.bus?.placa,
          tipoIncidente: inc.tipo,
          gravedad: inc.gravedad,
          descripcion: inc.descripcion,
          latitud: inc.latitud,
          longitud: inc.longitud,
          busId: inc.bus?.id,
          empresaId: inc.bus?.empresa?.id,
        }));

      console.log(
        `✅ Alertas filtradas para empresa ${empresaId}:`,
        alertas.length,
      );
      return alertas;
    } catch (error) {
      console.error('❌ Error en obtenerAlertasGerente:', error);
      throw error;
    }
  }
}
