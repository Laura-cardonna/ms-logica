import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Patch } from '@nestjs/common';
import { PqrsService } from './pqrs.service';
import { CreatePqrsDto } from './dto/create-pqrs.dto';
import { PqrsStatus } from './entities/pqrs.entity';

@Controller('pqrs')
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPqrsDto: CreatePqrsDto) {
    return this.pqrsService.createPqrs(createPqrsDto);
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