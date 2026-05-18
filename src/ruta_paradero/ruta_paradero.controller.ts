import { Controller, Get, Param } from '@nestjs/common';
import { RutaParaderoService } from './ruta_paradero.service';

@Controller('ruta-paradero')
export class RutaParaderoController {
  constructor(private readonly rutaParaderoService: RutaParaderoService) {}

  @Get()
  findAll() {
    return this.rutaParaderoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rutaParaderoService.findOne(+id);
  }
}