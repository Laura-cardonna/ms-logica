import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Patch } from '@nestjs/common';
import { PqrsService } from './pqrs.service';
import { CreatePqrsDto } from './dto/create-pqrs.dto';
import { PqrsStatus } from './entities/pqrs.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('pqrs')
export class PqrsController {
  constructor(
    private readonly pqrsService: PqrsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPqrsDto: CreatePqrsDto) {
    return this.pqrsService.createPqrs(createPqrsDto);
  }

  // Diagnóstico: prueba conectividad con N8N y muestra la URL configurada
  @Get('ping-n8n')
  async pingN8n() {
    const url = this.configService.get<string>('N8N_PQRS_WEBHOOK_URL');
    if (!url) return { ok: false, error: 'N8N_PQRS_WEBHOOK_URL no está en .env' };
    try {
      const res = await axios.post(url, { test: true, source: 'ping-n8n' });
      return { ok: true, url, status: res.status, data: res.data };
    } catch (err: any) {
      return {
        ok: false,
        url,
        status: err?.response?.status,
        error: err?.response?.data || err.message,
      };
    }
  }

  // endpoint para que N8N consulte los PQRS vencidos del supervisor
  @Get('vencidas')
  @HttpCode(HttpStatus.OK)
  getOverduePqrs() {
    return this.pqrsService.findOverdue();
  }

  // endpoint para que el ciudadano consulte por su número de radicado
  @Get(':radicado')
  @HttpCode(HttpStatus.OK)
  getByRadicado(@Param('radicado') radicado: string) {
    return this.pqrsService.findByRadicado(radicado);
  }

// NUEVO: Endpoint para cambiar el estado de la PQRS
  @Patch(':radicado/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('radicado') radicado: string,
    @Body('status') status: PqrsStatus,
    @Body('respuestaFinal') respuestaFinal?: string
  ) {
    return this.pqrsService.updateStatus(radicado, status, respuestaFinal);
  }

}