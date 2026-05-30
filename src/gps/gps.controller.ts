import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GpsService } from './gps.service';
import { CreateGpDto } from './dto/create-gp.dto';
import { UpdateUbicacionDto } from '../gps/dto/update-gp.dto';

@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post()
  create(@Body() createGpDto: CreateGpDto) {
    return this.gpsService.create(createGpDto);
  }

  @Get()
  findAll() {
    return this.gpsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gpsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUbicacionDto: UpdateUbicacionDto) {
    return this.gpsService.update(+id, updateUbicacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gpsService.remove(+id);
  }
}
