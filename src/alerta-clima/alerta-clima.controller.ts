import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/turno/get-user.decorator';
import { AlertaClimaService } from './alerta-clima.service';
import { ClimaOrquestadorService } from './clima.orquestador.service';
import { CreateAlertaClimaDto } from './dto/create-alerta-clima.dto';
import { UpdateAlertaClimaDto } from './dto/update-alerta-clima.dto';

@Controller('alerta-clima')
@UseGuards(JwtAuthGuard)
export class AlertaClimaController {
  constructor(
    private readonly alertaService: AlertaClimaService,
    private readonly orquestador: ClimaOrquestadorService,
  ) {}

  // Activar/actualizar la alerta de la persona autenticada (persona del JWT, no del body).
  @Post()
  crear(
    @GetUser('id') personaId: string,
    @Body() dto: CreateAlertaClimaDto,
  ) {
    return this.alertaService.crear(personaId, dto);
  }

  // Listar las alertas de la persona autenticada.
  @Get('persona')
  listarMias(@GetUser('id') personaId: string) {
    return this.alertaService.listarPorPersona(personaId);
  }

  // Disparo manual del grafo de clima (demo/verificación end-to-end).
  @Post('run')
  run() {
    return this.orquestador.ejecutar();
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: UpdateAlertaClimaDto) {
    return this.alertaService.actualizar(id, dto);
  }

  // Desactivar la alerta (el usuario puede apagarla en cualquier momento).
  @Delete(':id')
  desactivar(@Param('id') id: string) {
    return this.alertaService.desactivar(id);
  }
}
