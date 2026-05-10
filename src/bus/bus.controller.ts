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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BusService } from './bus.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('bus')
export class BusController {
  constructor(private readonly busService: BusService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './uploads', // Asegúrate de crear la carpeta 'uploads' en la raíz de tu proyecto Nest
        filename: (req, file, cb) => {
          // Generamos un nombre único para evitar que fotos con el mismo nombre se sobreescriban
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
    // Ya no extraemos empresaId del token aquí, el Service se encarga de asignar 'KALA'
    return this.busService.create(createBusDto, file);
  }

  @Get()
  findAll() {
    return this.busService.findAll();
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
