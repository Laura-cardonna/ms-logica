import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePqrsDto } from './dto/create-pqrs.dto';
import { PqrsEntity, PqrsStatus } from './entities/pqrs.entity';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class PqrsService {
  constructor(
    @InjectRepository(PqrsEntity)
    private readonly pqrsRepository: Repository<PqrsEntity>,
    private readonly configService: ConfigService,
  ) {}

  async createPqrs(createPqrsDto: CreatePqrsDto) {
    try {
      const savedImageUrls: string[] = [];

      // 1. Procesamos y guardamos localmente las imágenes si existen
      if (createPqrsDto.images && createPqrsDto.images.length > 0) {
        const MAX_IMAGES = 3;
        const imagesToProcess = createPqrsDto.images.slice(0, MAX_IMAGES);
        
        const uploadDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (let i = 0; i < imagesToProcess.length; i++) {
          const base64Data = imagesToProcess[i].replace(/^data:image\/\w+;base64,/, '');
          const filename = `pqrs-${Date.now()}-${i}.png`;
          const filepath = path.join(uploadDir, filename);

          // CORREGIDO: Usamos 'base64' para escribir correctamente el archivo binario
          fs.writeFileSync(filepath, base64Data, 'base64');
          
          const backendUrl = this.configService.get<string>('BACKEND_URL');
          if (!backendUrl) {
            throw new InternalServerErrorException('La variable BACKEND_URL no está definida en el archivo .env');
          }
          
          savedImageUrls.push(`${backendUrl}/uploads/${filename}`);
        }
      }

      // 2. Definir tiempo prometido (15 días calendario desde hoy)
      const creationDate = new Date();
      const DAYS_TO_RESPOND = 15;
      const dueDate = new Date();
      dueDate.setDate(creationDate.getDate() + DAYS_TO_RESPOND);

      // 3. Primer guardado con radicado temporal para obtener el numericId de MySQL
      const newPqrs = this.pqrsRepository.create({
        type: createPqrsDto.type,
        category: createPqrsDto.category,
        description: createPqrsDto.description,
        email: createPqrsDto.email,
        images: savedImageUrls,
        status: PqrsStatus.PENDIENTE,
        dueDate: dueDate,
        radicado: `TEMP-${Date.now()}`, // Temporal único requerido por el índice UNIQUE
      });

      const savedPqrs = await this.pqrsRepository.save(newPqrs);

      // 4. Generar radicado oficial usando el numericId real (Ej: PQRS-2026-000005)
      const currentYear = creationDate.getFullYear(); // Dará 2026 dinámicamente
      const consecutive = String(savedPqrs.numericId).padStart(6, '0'); 
      const generatedRadicado = `PQRS-${currentYear}-${consecutive}`;

      // Actualizar registro con su radicado final
      savedPqrs.radicado = generatedRadicado;
      await this.pqrsRepository.save(savedPqrs);

      // 5. Preparar payload dinámico para N8N
      const n8nPayload = {
        radicado: savedPqrs.radicado,
        type: savedPqrs.type,
        category: savedPqrs.category,
        description: savedPqrs.description,
        email: savedPqrs.email,
        images: savedPqrs.images,
        status: savedPqrs.status,
        createdAt: savedPqrs.createdAt,
        dueDate: savedPqrs.dueDate,
        daysEstimated: DAYS_TO_RESPOND
      };

      // 6. Obtener URL de N8N del .env
      const n8nUrl = this.configService.get<string>('N8N_PQRS_WEBHOOK_URL');
      if (!n8nUrl) {
        throw new InternalServerErrorException(
          'La URL de n8n (N8N_PQRS_WEBHOOK_URL) no está configurada en el archivo .env.'
        );
      }

      // 7. Enviar a N8N de forma asíncrona (no bloquea al usuario)
      axios.post(n8nUrl, n8nPayload).catch((err) => {
        console.error('Error enviando datos a N8N:', err.message);
      });

      // Retornar respuesta estructurada al Frontend en Angular
      return {
        message: 'PQRS radicada exitosamente',
        radicado: savedPqrs.radicado,
        status: savedPqrs.status,
        estimatedResponseDate: savedPqrs.dueDate
      };

    } catch (error: any) {
      console.error('Error procesando PQRS:', error?.message || error);
      throw new InternalServerErrorException(
        'No se pudo procesar la solicitud de PQRS en este momento.'
      );
    }
  }

  // 8. Consulta de estado para el Ciudadano por número de Radicado
  async findByRadicado(radicado: string) {
    try {
      const pqrs = await this.pqrsRepository.findOne({
        where: { radicado },
        select: ['radicado', 'type', 'category', 'description', 'status', 'createdAt', 'dueDate'],
      });

      if (!pqrs) {
        return {
          found: false,
          message: `No se encontró ninguna solicitud con el radicado ${radicado}`,
        };
      }

      return {
        found: true,
        pqrs,
      };
    } catch (error: any) {
      console.error('Error al consultar radicado:', error?.message || error);
      throw new InternalServerErrorException('Error interno al consultar el radicado.');
    }
  }

  // 9. Consulta de PQRS vencidas para la alerta del Supervisor en N8N
  async findOverdue() {
    try {
      const currentTime = new Date(); // Captura el tiempo real del sistema en 2026

      // Buscamos todas las PQRS que no estén Resueltas y cuya fecha límite ya pasó
      const overduePqrs = await this.pqrsRepository.createQueryBuilder('pqrs')
        .where('pqrs.status != :status', { status: PqrsStatus.RESUELTO })
        .andWhere('pqrs.dueDate <= :currentTime', { currentTime })
        .getMany();

      return {
        count: overduePqrs.length,
        data: overduePqrs,
      };
    } catch (error: any) {
      console.error('Error al consultar PQRS vencidas:', error?.message || error);
      throw new InternalServerErrorException('Error interno al consultar solicitudes vencidas.');
    }
  }

  // Agrega este método dentro de tu clase PqrsService

async updateStatus(radicado: string, newStatus: PqrsStatus, respuestaFinal?: string) {
  try {
    // 1. Buscar la PQRS existente
    const pqrs = await this.pqrsRepository.findOne({ where: { radicado } });

    if (!pqrs) {
      throw new InternalServerErrorException(`No se encontró la PQRS con radicado ${radicado}`);
    }

    // 2. Actualizar estado
    pqrs.status = newStatus;
    await this.pqrsRepository.save(pqrs);

    // 3. Notificar a N8N del cambio de estado
    const n8nUrl = this.configService.get<string>('N8N_PQRS_WEBHOOK_URL');
    if (n8nUrl) {
      const statusPayload = {
        evento: 'CAMBIO_ESTADO',
        radicado: pqrs.radicado,
        email: pqrs.email,
        status: pqrs.status,
        type: pqrs.type,
        respuestaFinal: respuestaFinal || 'Su solicitud está siendo procesada.'
      };

      // Envío asíncrono
      axios.post(n8nUrl, statusPayload).catch((err) => {
        console.error('Error enviando cambio de estado a N8N:', err.message);
      });
    }

    return {
      message: `PQRS cambiada a estado: ${newStatus}`,
      radicado: pqrs.radicado,
      status: pqrs.status,
    };
  } catch (error: any) {
    console.error('Error al actualizar estado:', error?.message || error);
    throw new InternalServerErrorException('No se pudo actualizar el estado de la PQRS.');
  }
}
}