import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RutaService } from './ruta.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';

@Controller('ruta')
export class RutaController {
  constructor(private readonly rutaService: RutaService) {}

  /**
   * Crea una nueva ruta
   */
  @Post()
  create(@Body() createRutaDto: CreateRutaDto) {
    return this.rutaService.create(createRutaDto);
  }

  /**
   * Obtiene todas las rutas disponibles
   * Criterio de aceptación HU-ENTR-2-001: El sistema muestra un listado de todas las rutas con nombre y descripción
   * @param nombre Filtro opcional por nombre de ruta
   * @returns Lista de rutas con nombre, descripción y tarifa
   */
  @Get()
  findAll(@Query('nombre') nombre?: string) {
    return this.rutaService.findAll(nombre);
  }

  /**
   * Obtiene una ruta específica por ID
   * @param id ID de la ruta
   * @returns Ruta encontrada
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rutaService.findOne(+id);
  }

  /**
   * Obtiene todos los paraderos de una ruta en orden secuencial
   * Criterio de aceptación HU-ENTR-2-001: Al seleccionar una ruta, se visualizan todos los paraderos 
   * en orden secuencial en un mapa
   * @param id ID de la ruta
   * @returns Ruta con paraderos ordenados incluyendo coordenadas GPS
   */
  @Get(':id/paraderos')
  findParaderosByRuta(@Param('id') id: string) {
    return this.rutaService.findOneWithParaderos(+id);
  }

  /**
   * Obtiene el recorrido detallado de una ruta (paraderos con distancias y tiempos)
   * Criterio de aceptación HU-ENTR-2-001: Se muestra el tiempo estimado total de recorrido
   * Criterio de aceptación HU-ENTR-2-009: Se puede visualizar la ruta en un mapa con detalles de recorrido
   * @param id ID de la ruta
   * @returns DTO con información detallada del recorrido incluyendo distancias y tiempos calculados
   */
  @Get(':id/recorrido')
  obtenerRecorrido(@Param('id') id: string) {
    return this.rutaService.obtenerRecorrido(+id);
  }

  /**
   * Actualiza una ruta existente
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRutaDto: UpdateRutaDto) {
    return this.rutaService.update(+id, updateRutaDto);
  }

  /**
   * Elimina una ruta
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rutaService.remove(+id);
  }
}
