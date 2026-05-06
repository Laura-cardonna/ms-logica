import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DestinatarioService } from './destinatario.service';
import { CreateDestinatarioDto } from './dto/create-destinatario.dto';
import { UpdateDestinatarioDto } from './dto/update-destinatario.dto';

@Controller('destinatario')
export class DestinatarioController {
  constructor(private readonly destinatarioService: DestinatarioService) {}

  @Post()
  create(@Body() createDestinatarioDto: CreateDestinatarioDto) {
    return this.destinatarioService.create(createDestinatarioDto);
  }

  @Get()
  findAll() {
    return this.destinatarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.destinatarioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDestinatarioDto: UpdateDestinatarioDto) {
    return this.destinatarioService.update(+id, updateDestinatarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.destinatarioService.remove(+id);
  }
}
