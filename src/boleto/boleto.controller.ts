import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('boletos')
@ApiBearerAuth()
//@UseGuards(JwtAuthGuard)
@Controller('boletos')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

  @ApiOperation({ summary: 'Registrar abordaje y generar boleto' })
  @ApiResponse({ status: 201, description: 'Abordaje exitoso' })
  @Post()
  async create(@Body() createBoletoDto: CreateBoletoDto) {
    try {
      const resultado = await this.boletoService.create(createBoletoDto);
      return resultado;
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({ summary: 'Listar boletos' })
  @ApiResponse({ status: 200, description: 'Listado de boletos' })
  @Get()
  findAll() {
    return this.boletoService.findAll();
  }

  @ApiOperation({ summary: 'Obtener boleto por ID' })
  @ApiResponse({ status: 200, description: 'Boleto encontrado' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boletoService.findOne(+id);
  }

  @ApiOperation({ summary: 'Actualizar estado o fin del viaje' })
  @ApiResponse({ status: 200, description: 'Boleto actualizado' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoletoDto: UpdateBoletoDto) {
    return this.boletoService.update(+id, updateBoletoDto);
  }

  @ApiOperation({ summary: 'Eliminar boleto' })
  @ApiResponse({ status: 200, description: 'Boleto eliminado' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boletoService.remove(+id);
  }
}
