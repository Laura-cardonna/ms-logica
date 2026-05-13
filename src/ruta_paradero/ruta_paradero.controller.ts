import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RutaParaderoService } from './ruta_paradero.service';
import { CreateRutaParaderoDto } from './dto/create-ruta_paradero.dto';
import { UpdateRutaParaderoDto } from './dto/update-ruta_paradero.dto';

@Controller('ruta-paradero')
export class RutaParaderoController {
  constructor(private readonly rutaParaderoService: RutaParaderoService) {}

  /**
   * Crea una nueva relación entre ruta y paradero
   */
  @Post()
  create(@Body() createRutaParaderoDto: CreateRutaParaderoDto) {
    return this.rutaParaderoService.create(createRutaParaderoDto);
  }

  /**
   * Obtiene todas las relaciones ruta-paradero
   */
  @Get()
  findAll() {
    return this.rutaParaderoService.findAll();
  }

  /**
   * Obtiene una relación ruta-paradero por ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rutaParaderoService.findOne(+id);
  }

  /**
   * Actualiza una relación ruta-paradero
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRutaParaderoDto: UpdateRutaParaderoDto) {
    return this.rutaParaderoService.update(+id, updateRutaParaderoDto);
  }

  /**
   * Elimina una relación ruta-paradero
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rutaParaderoService.remove(+id);
  }
}
