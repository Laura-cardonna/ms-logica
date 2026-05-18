import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Header,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { BusService } from './bus.service';
import { BusScanPageService } from './presentation/bus-scan-page.service';

import { CreateBusDto } from './dto/create-bus.dto';

import { UpdateBusDto } from './dto/update-bus.dto';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { diskStorage } from 'multer';

import { extname } from 'path';

@Controller('bus')
export class BusController {
  constructor(
    private readonly busService: BusService,
    private readonly busScanPageService: BusScanPageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './uploads', // Se mantiene tu carpeta raíz de subidas

        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)

            .map(() => Math.round(Math.random() * 16).toString(16))

            .join('');

          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body() createBusDto: CreateBusDto,

    @UploadedFile() file?: any,
  ) {
    return this.busService.create(createBusDto, file);
  }

  // 🎯 NUEVO ENDPOINT: Para la validación rápida del QR desde el Front

  // Permitirá buscar la info extendida del bus usando la placa: /bus/buscar/por-placa?placa=XYZ123

  @Get('buscar/por-placa')
  async buscarPorPlaca(@Query('placa') placa: string) {
    return this.busService.obtenerPorPlaca(placa);
  }

  // Escaneo público del QR: muestra una página HTML con los datos del bus
  @Get('scan/:placa')
  @Header('Content-Type', 'text/html')
  async scan(@Param('placa') placa: string) {
    const bus = await this.busService.obtenerPorPlaca(placa);

    return this.busScanPageService.render(bus);
  }

  // (no record endpoint – scan page does not POST)

  @Get()
  findAll(@Query('estado') estado?: string) {
    return this.busService.findAll(estado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.busService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    return this.busService.update(+id, updateBusDto);
  }
}
