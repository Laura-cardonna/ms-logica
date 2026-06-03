import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PersonaService } from './persona.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Controller('persona')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @Post()
  create(@Body() createPersonaDto: CreatePersonaDto) {
    return this.personaService.create(createPersonaDto);
  }

  @Get()
  findAll() {
    return this.personaService.findAll();
  }

  // CORREGIDO: Ahora recibe el nombre y opcionalmente el ID a excluir
  // Se accede como: GET /persona/buscar?nombre=juan&excluirId=uuid-del-creador
  @Get('buscar')
  async buscar(
    @Query('nombre') nombre: string,
    @Query('excluirId') excluirId?: string, // <-- Agregamos esta línea
  ) {
    return this.personaService.buscarPorNombre(nombre, excluirId); // <-- Pasamos el excluirId al servicio
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonaDto: UpdatePersonaDto) {
    return this.personaService.update(id, updatePersonaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personaService.remove(id);
  }
}