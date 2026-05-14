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
  ApiTags,
} from '@nestjs/swagger';
import { BoletoService } from './boleto.service';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // <-- ASEGÚRATE QUE ESTA RUTA SEA CORRECTA
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@ApiTags('boletos')
@ApiBearerAuth()
@Controller('boletos')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

  /**
   * NUEVO ENDPOINT: Obtiene los boletos del usuario autenticado.
   * En el Front se debe llamar como: GET /boletos/mis-boletos
   */
  @ApiOperation({ summary: 'Obtener boletos del ciudadano autenticado' })
  @UseGuards(JwtAuthGuard)
  @Get('mis-boletos')
  async findMyTickets(@Req() req: any) {
    // El Guard extrae el ID del token y lo pone en req.user.id
    const ciudadanoId = req.user.id;
    console.log('📋 Listando boletos para el ciudadano:', ciudadanoId);
    return this.boletoService.getBoletosByUserId(ciudadanoId);
  }

  @ApiOperation({ summary: 'Registrar abordaje y generar boleto' })
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    const authHeader = (req.headers['authorization'] as string) || (req.headers['Authorization'] as string);
    if (!authHeader) throw new UnauthorizedException('Authorization header missing');

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
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
      ciudadano_id: ciudadanoId, 
      nombre: (payload.name ?? payload.nombre ?? payload.sub) as string,
      email: (payload.email ?? payload.mail) as string,
    };

    return await this.boletoService.create(data);
  }

  // Mantenemos este por si un admin necesita buscar boletos de alguien específico
  @ApiOperation({ summary: 'Obtener boletos de un usuario específico por ID' })
  @Get('user/:id')
  findByUser(@Param('id') id: string) {
    return this.boletoService.getBoletosByUserId(id);
  }

  @Get()
  findAll() {
    return this.boletoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
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
}