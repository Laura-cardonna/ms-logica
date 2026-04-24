import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MetodoPagoCiudadanoService } from './metodo_pago_ciudadano.service';
import { CreateMetodoPagoCiudadanoDto } from './dto/create-metodo_pago_ciudadano.dto';
import { UpdateMetodoPagoCiudadanoDto } from './dto/update-metodo_pago_ciudadano.dto';

@Controller('metodo-pago-ciudadano')
export class MetodoPagoCiudadanoController {
  constructor(private readonly metodoPagoCiudadanoService: MetodoPagoCiudadanoService) {}

  @Post()
  create(@Body() createMetodoPagoCiudadanoDto: CreateMetodoPagoCiudadanoDto) {
    return this.metodoPagoCiudadanoService.create(createMetodoPagoCiudadanoDto);
  }

  @Get()
  findAll() {
    return this.metodoPagoCiudadanoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metodoPagoCiudadanoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMetodoPagoCiudadanoDto: UpdateMetodoPagoCiudadanoDto) {
    return this.metodoPagoCiudadanoService.update(+id, updateMetodoPagoCiudadanoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.metodoPagoCiudadanoService.remove(+id);
  }
}
