import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { CreateHistorialDto } from './dto/create-historial.dto';
import { UpdateHistorialDto } from './dto/update-historial.dto';

@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Post()
  create(@Body() createHistorialDto: CreateHistorialDto) {
    return this.historialService.create(createHistorialDto);
  }

  @Get()
  findAll() {
    return this.historialService.findAll();
  }

  /**
   * HU-005: Obtiene los paraderos validados por un ciudadano para armar la ruta
   * GET /historial/recorrido/{ciudadanoId}
   * @param ciudadanoId ID del ciudadano
   */
  @Get('recorrido/:ciudadanoId')
  findValidatedStopsByCitizen(@Param('ciudadanoId') ciudadanoId: string) {
    return this.historialService.findValidatedStopsByCitizen(ciudadanoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historialService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHistorialDto: UpdateHistorialDto,
  ) {
    return this.historialService.update(+id, updateHistorialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historialService.remove(+id);
  }
}

