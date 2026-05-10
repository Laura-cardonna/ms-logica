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

@ApiTags('boletos')
@ApiBearerAuth()
//@UseGuards(JwtAuthGuard)
@Controller('boletos')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

  @ApiOperation({
    summary:
      'Registrar abordaje y generar boleto (decodifica JWT desde header Authorization)',
  })
  @ApiResponse({ status: 201, description: 'Abordaje exitoso' })
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    try {
      const authHeader =
        (req.headers['authorization'] as string) ||
        (req.headers['Authorization'] as string);
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header missing');
      }

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

      // 1. Extraemos el ID como String (sin el Number())
      const ciudadanoId = payload.id ?? payload.sub;

      // 2. Validamos que el ID exista y no esté vacío
      if (
        !ciudadanoId ||
        ciudadanoId === 'undefined' ||
        ciudadanoId === 'null'
      ) {
        throw new UnauthorizedException(
          'Invalid token payload: missing user id',
        );
      }

      // 3. Ya no usamos Number() en la data que enviamos al servicio
      const data = {
        bus_id: Number(body.bus_id ?? body.busId),
        paradero_id: Number(body.paradero_id ?? body.paraderoId),
        metodo_pago_id: Number(body.metodo_pago_id ?? body.metodoPagoId),
        ciudadano_id: ciudadanoId,
        nombre: (payload.name ?? payload.nombre ?? payload.sub) as string,
        email: (payload.email ?? payload.mail) as string,
      };

      const resultado = await this.boletoService.create(data);
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
