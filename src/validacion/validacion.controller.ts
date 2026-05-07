import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ValidacionService } from './validacion.service';
import { CreateValidacionDto } from './dto/create-validacion.dto';
import { UpdateValidacionDto } from './dto/update-validacion.dto';

@Controller('validacion')
export class ValidacionController {
  constructor(private readonly validacionService: ValidacionService) {}

  @Post()
  create(@Body() createValidacionDto: CreateValidacionDto) {
    return this.validacionService.create(createValidacionDto);
  }

  @Get()
  findAll() {
    return this.validacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.validacionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateValidacionDto: UpdateValidacionDto) {
    return this.validacionService.update(+id, updateValidacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.validacionService.remove(+id);
  }
}
