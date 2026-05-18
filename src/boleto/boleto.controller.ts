import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { DetalleViajeResponseDto } from './dto/detalle-viaje-response.dto';
@ApiTags('boletos')
@ApiBearerAuth()
@Controller('boletos')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

  @ApiOperation({ summary: 'Registrar abordaje y generar boleto' })
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    const authHeader =
      (req.headers['authorization'] as string) ||
      (req.headers['Authorization'] as string);
    if (!authHeader)
      throw new UnauthorizedException('Authorization header missing');

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    const SECRET = process.env.JWT_SECRET;

    let payload: any;
    try {
      payload = jwt.verify(token, SECRET) as any;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }

    const ciudadanoId = payload.id ?? payload.sub;

    if (!ciudadanoId || ciudadanoId === 'undefined' || ciudadanoId === 'null') {
      throw new UnauthorizedException('Invalid token payload: missing user id');
    }

    const data = {
      bus_id: Number(body.bus_id ?? body.busId),
      paradero_id: Number(body.paradero_id ?? body.paraderoId),
      metodo_pago_id: Number(body.metodo_pago_id ?? body.metodoPagoId),
      ciudadano_id: ciudadanoId, // String UUID
      nombre: (payload.name ?? payload.nombre ?? payload.sub) as string,
      email: (payload.email ?? payload.mail) as string,
    };

    return await this.boletoService.create(data);
  }

  // Esta es la que busca Angular primero (y falla con 404)
  @ApiOperation({ summary: 'Obtener boletos de un usuario (Ruta English)' })
  @Get('user/:id')
  findByUser(@Param('id') id: string) {
    return this.boletoService.getBoletosByUserId(id);
  }
  // ----------------------------------------------------

  @Get()
  findAll() {
    return this.boletoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Si el ID del BOLETO es numérico, dejamos el +, si es UUID, quítalo.
    return this.boletoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoletoDto: UpdateBoletoDto) {
    return this.boletoService.update(+id, updateBoletoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boletoService.remove(+id);
  }

  @Get(':id/recorrido')
  async verRecorridoViaje(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DetalleViajeResponseDto> {
    return this.boletoService.obtenerRecorrido(id);
  }
}
