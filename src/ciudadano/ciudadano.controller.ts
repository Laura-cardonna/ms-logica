import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CiudadanoService } from './ciudadano.service';
import { CreateCiudadanoDto } from './dto/create-ciudadano.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';

@Controller('ciudadano')
export class CiudadanoController {
  constructor(private readonly ciudadanoService: CiudadanoService) {}
  // --- ESTE ES EL NUEVO ENDPOINT QUE DEBES AGREGAR ---
  @Post('find-or-create')
  async findOrCreate(@Body() payload: any) {
    // Aquí es donde el Front-end enviará el payload del token decodificado
    console.log('--- Sincronizando Ciudadano ---');
    return this.ciudadanoService.findOrCreateByEmail(payload);
  }
  
  @Post()
  create(@Body() createCiudadanoDto: CreateCiudadanoDto) {
    return this.ciudadanoService.create(createCiudadanoDto);
  }

  @Get()
  findAll() {
    return this.ciudadanoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Eliminamos el '+' porque el ID ahora es string (UUID)
    return this.ciudadanoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCiudadanoDto: UpdateCiudadanoDto) {
    // Eliminamos el '+' para que pase el string correctamente
    return this.ciudadanoService.update(id, updateCiudadanoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // Eliminamos el '+' para que no intente convertir a número
    return this.ciudadanoService.remove(id);
  }
}