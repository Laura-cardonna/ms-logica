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

  // Ahora se accede como: GET /persona/buscar?query=texto&excluirId=uuid
  @Get('buscar')
  async buscar(
    @Query('query') query: string,
    @Query('excluirId') excluirId?: string,
  ) {
    // Si no hay query, devolvemos vacío para no traer toda la base
    if (!query) return [];
    return this.personaService.buscar(query, excluirId);
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