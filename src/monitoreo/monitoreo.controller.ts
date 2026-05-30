import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { MonitoreoService } from './monitoreo.service';
import { UpdateUbicacionDto } from '../gps/dto/update-ubicacion.dto';
import { GpsApiKeyGuard } from '../auth/gps-api-key.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Monitoreo')
@Controller('monitoreo')
export class MonitoreoController {
  constructor(private readonly monitoreoService: MonitoreoService) {}

  @Post('bus/:busId/ubicacion')
  @UseGuards(GpsApiKeyGuard)
  @ApiOperation({ summary: 'Actualizar posición GPS del bus' })
  actualizarUbicacion(
    @Param('busId') busId: string,
    @Body() dto: UpdateUbicacionDto,
  ) {
    return this.monitoreoService.actualizarUbicacion(
      Number(busId),
      dto.latitude,
      dto.longitude,
      dto.velocidad ?? 0,
    );
  }

  @Get('ruta/:rutaId/buses-activos')
  @ApiOperation({ summary: 'Obtener buses activos de una ruta' })
  getBusesActivos(@Param('rutaId') rutaId: string) {
    return this.monitoreoService.getBusesActivosPorRuta(Number(rutaId));
  }

  @Get('bus/:busId/eta/:paraderoId')
  @ApiOperation({ summary: 'Estimar tiempo de llegada a un paradero' })
  getEta(
    @Param('busId') busId: string,
    @Param('paraderoId') paraderoId: string,
  ) {
    return this.monitoreoService.getEtaParaParadero(Number(busId), Number(paraderoId));
  }
}